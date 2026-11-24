import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.request
import uuid
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from notifications.models import Notification
from notifications.services import dispatch_order_notifications
from .models import Order, OrderItem, Payment
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer


class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.prefetch_related('items__food_item').get(student=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.canteen:
            return Response({'error': 'No canteen assigned to cart.'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(item.subtotal for item in cart.items.all())
        tax = subtotal * Decimal('0.00')
        total = subtotal + tax

        order = Order.objects.create(
            student=request.user,
            canteen=cart.canteen,
            subtotal=subtotal,
            tax_amount=tax,
            total_amount=total,
            payment_method=serializer.validated_data.get('payment_method', 'cash'),
            special_instructions=serializer.validated_data.get('special_instructions', ''),
        )

        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                food_item=cart_item.food_item,
                item_name=cart_item.food_item.name,
                item_price=cart_item.food_item.price,
                quantity=cart_item.quantity,
            )
            cart_item.food_item.total_orders += cart_item.quantity
            cart_item.food_item.save(update_fields=['total_orders'])

        # Clear cart
        cart.items.all().delete()
        cart.canteen = None
        cart.save()

        # Create payment record
        Payment.objects.create(order=order, amount=total, method=order.payment_method)

        # Notify canteen admin
        try:
            from accounts.models import CanteenAdminProfile
            admin_profiles = CanteenAdminProfile.objects.filter(canteen=order.canteen)
            for ap in admin_profiles:
                Notification.objects.create(
                    recipient=ap.user,
                    title='New Order Pending Acceptance',
                    message=f'Order #{order.order_number} placed by {request.user.full_name}. Needs your acceptance.',
                    notification_type='new_order',
                    related_order=order,
                )
        except Exception as e:
            print(f"[Admin In-App Notification Error] {e}")

        # Dispatch multi-channel notifications via on_commit so external service issues NEVER rollback order
        order_id = order.id
        def send_order_notifs():
            try:
                fresh_order = Order.objects.get(id=order_id)
                dispatch_order_notifications(fresh_order, 'placed', async_delivery=True)
            except Exception as e:
                print(f"[Order Notification Dispatch Error] {e}")

        transaction.on_commit(send_order_notifs)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class StudentOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(student=self.request.user).prefetch_related('items', 'payment').order_by('-created_at')

    def post(self, request, *args, **kwargs):
        return OrderCreateView().post(request)


class StudentOrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(student=self.request.user)


class CanteenOrderListView(generics.ListAPIView):
    """Canteen admin view - list orders for their canteen (newest first)"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'canteen_admin':
            profile = getattr(user, 'canteen_admin_profile', None)
            if not profile or not profile.canteen:
                return Order.objects.none()
            canteen = profile.canteen
        elif user.role == 'super_admin':
            canteen_id = self.request.query_params.get('canteen')
            if canteen_id:
                from canteens.models import Canteen
                try:
                    canteen = Canteen.objects.get(id=canteen_id)
                except Canteen.DoesNotExist:
                    return Order.objects.none()
            else:
                qs = Order.objects.all().prefetch_related('items', 'payment').order_by('-created_at')
                status_filter = self.request.query_params.get('status')
                date = self.request.query_params.get('date')
                if status_filter:
                    qs = qs.filter(status=status_filter.lower())
                if date:
                    qs = qs.filter(created_at__date=date)
                return qs
        else:
            return Order.objects.none()

        qs = Order.objects.filter(canteen=canteen).prefetch_related('items', 'payment').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        date = self.request.query_params.get('date')

        if status_filter:
            qs = qs.filter(status=status_filter.lower())
        if date:
            qs = qs.filter(created_at__date=date)
        return qs


class OrderStatusUpdateView(APIView):
    """Canteen admin updates order status"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        user = request.user
        if user.role not in ['canteen_admin', 'super_admin']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            if user.role == 'canteen_admin':
                order = Order.objects.get(id=order_id, canteen=user.canteen_admin_profile.canteen)
            else:
                order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_status = order.status
        new_status = serializer.validated_data['status']
        order.status = new_status
        if new_status == 'cancelled':
            order.cancellation_reason = serializer.validated_data.get('cancellation_reason', '')

        # Handle estimated completion / preparation time
        prep_minutes = serializer.validated_data.get('estimated_prep_minutes')
        if prep_minutes is not None:
            order.estimated_prep_minutes = prep_minutes
            order.estimated_ready_at = timezone.now() + timedelta(minutes=prep_minutes)

        order.save()

        # Multi-channel notification dispatch (non-blocking)
        try:
            dispatch_order_notifications(order, new_status, async_delivery=True)
        except Exception as e:
            print(f"[Status Notification Error] {e}")

        return Response(OrderSerializer(order).data)


class CancelOrderView(APIView):
    """Student cancels their own order"""
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, student=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status not in ['placed']:
            return Response(
                {'error': 'Only placed orders can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'cancelled'
        order.cancellation_reason = request.data.get('reason', 'Cancelled by student')
        order.save()

        # Multi-channel notification for student cancellation (non-blocking)
        try:
            dispatch_order_notifications(order, 'cancelled', async_delivery=True)
        except Exception as e:
            print(f"[Cancel Notification Error] {e}")

        return Response(OrderSerializer(order).data)


class RateOrderView(APIView):
    """Student rates their completed order (1 to 5 stars + review)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, student=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        rating = request.data.get('rating')
        if not rating or int(rating) < 1 or int(rating) > 5:
            return Response({'error': 'Rating must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        order.rating = int(rating)
        order.review = request.data.get('review', '')
        order.save()

        return Response(OrderSerializer(order).data)


class VerifyOrderPinView(APIView):
    """Canteen staff verifies student pickup PIN for fast counter handover"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role not in ['canteen_admin', 'super_admin']:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        pin = request.data.get('pickup_pin', '').strip()
        if not pin:
            return Response({'error': 'PIN is required.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Order.objects.filter(pickup_pin=pin)
        if user.role == 'canteen_admin':
            qs = qs.filter(canteen=user.canteen_admin_profile.canteen)

        order = qs.first()
        if not order:
            return Response({'error': f'No order found with PIN {pin}.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(OrderSerializer(order).data)


class RazorpayCreateOrderView(APIView):
    """
    POST /api/orders/razorpay/create-order/
    Initializes a Razorpay payment order for the student's active cart.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        try:
            cart = Cart.objects.prefetch_related('items__food_item').get(student=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.canteen:
            return Response({'error': 'Cart is not linked to any canteen.'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = sum(item.food_item.price * item.quantity for item in cart.items.all())
        total = subtotal  # 0% subsidized tax

        special_instructions = request.data.get('special_instructions', '')

        # Create pending order
        order = Order.objects.create(
            student=request.user,
            canteen=cart.canteen,
            subtotal=subtotal,
            tax_amount=Decimal('0.00'),
            total_amount=total,
            payment_method='online',
            payment_status='pending',
            status='placed',
            special_instructions=special_instructions,
        )

        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                food_item=cart_item.food_item,
                item_name=cart_item.food_item.name,
                item_price=cart_item.food_item.price,
                quantity=cart_item.quantity,
            )

        amount_paise = int(total * 100)
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_51MockDemoKey')
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'mock_secret_key_12345')

        # Check if real razorpay keys are present
        is_mock = not (key_id and key_secret and key_id.startswith(('rzp_test_', 'rzp_live_')) and key_secret != 'mock_secret_key_12345')
        rzp_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"

        if not is_mock:
            try:
                auth_str = base64.b64encode(f"{key_id}:{key_secret}".encode('ascii')).decode('ascii')
                req_data = json.dumps({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": order.order_number,
                    "notes": {
                        "order_id": order.id,
                        "canteen": order.canteen.name,
                        "student_email": request.user.email
                    }
                }).encode('utf-8')
                req = urllib.request.Request(
                    "https://api.razorpay.com/v1/orders",
                    data=req_data,
                    headers={
                        "Authorization": f"Basic {auth_str}",
                        "Content-Type": "application/json"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    resp_data = json.loads(resp.read().decode('utf-8'))
                    rzp_order_id = resp_data.get('id', rzp_order_id)
            except Exception as e:
                print(f"[Razorpay API Fallback to Test Simulation]: {e}")
                is_mock = True

        Payment.objects.update_or_create(
            order=order,
            defaults={
                'amount': total,
                'method': 'online',
                'status': 'pending',
                'transaction_id': rzp_order_id
            }
        )

        return Response({
            "order_id": order.id,
            "order_number": order.order_number,
            "razorpay_order_id": rzp_order_id,
            "amount": amount_paise,
            "currency": "INR",
            "key_id": key_id,
            "canteen_name": order.canteen.name,
            "student_name": request.user.full_name,
            "student_email": request.user.email,
            "student_phone": getattr(request.user, 'mobile', ''),
            "is_mock": is_mock
        }, status=status.HTTP_201_CREATED)


class RazorpayVerifyPaymentView(APIView):
    """
    POST /api/orders/razorpay/verify/
    Verifies Razorpay payment signature and confirms order placement.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get('order_id')
        rzp_order_id = request.data.get('razorpay_order_id', '')
        rzp_payment_id = request.data.get('razorpay_payment_id', '')
        rzp_signature = request.data.get('razorpay_signature', '')

        try:
            order = Order.objects.get(id=order_id, student=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'mock_secret_key_12345')

        # Verify signature
        if rzp_order_id.startswith('order_mock_') or key_secret == 'mock_secret_key_12345':
            # Simulated/Dev payment passed
            is_valid = True
        else:
            try:
                msg = f"{rzp_order_id}|{rzp_payment_id}".encode('utf-8')
                generated_signature = hmac.new(key_secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()
                is_valid = hmac.compare_digest(generated_signature, rzp_signature)
            except Exception as e:
                print(f"[Razorpay Signature Verification Error] {e}")
                is_valid = False

        if not is_valid:
            return Response({'error': 'Payment verification failed. Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark payment completed & order paid
        order.payment_status = 'paid'
        order.save(update_fields=['payment_status'])

        Payment.objects.filter(order=order).update(
            status='completed',
            transaction_id=rzp_payment_id or rzp_order_id
        )

        # Increment total_orders on items
        for item in order.items.all():
            if item.food_item:
                item.food_item.total_orders += item.quantity
                item.food_item.save(update_fields=['total_orders'])

        # Clear cart
        try:
            cart = Cart.objects.get(student=request.user)
            cart.items.all().delete()
            cart.canteen = None
            cart.save()
        except Exception as e:
            print(f"[Clear Cart Error] {e}")

        # Notify Canteen Admin
        try:
            from accounts.models import CanteenAdminProfile
            admin_profiles = CanteenAdminProfile.objects.filter(canteen=order.canteen)
            for ap in admin_profiles:
                Notification.objects.create(
                    recipient=ap.user,
                    title='New Paid Order Pending Acceptance',
                    message=f'Paid Order #{order.order_number} (Rs. {order.total_amount:.2f}) placed by {request.user.full_name}.',
                    notification_type='new_order',
                    related_order=order,
                )
        except Exception as e:
            print(f"[Admin In-App Notification Error] {e}")

        # Dispatch placed notifications on commit
        order_pk = order.id
        def send_notifs():
            try:
                fresh_order = Order.objects.get(id=order_pk)
                dispatch_order_notifications(fresh_order, 'placed', async_delivery=True)
            except Exception as e:
                print(f"[Order Notification Error] {e}")

        transaction.on_commit(send_notifs)

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)
