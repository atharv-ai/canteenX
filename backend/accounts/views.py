from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import EmailMultiAlternatives
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings

from django.utils import timezone
from .models import User, StudentProfile, CanteenAdminProfile, EmailOTP
from .services import generate_and_send_otp
from .permissions import IsSuperAdmin
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer,
    UserDetailSerializer, UserUpdateSerializer
)
from canteens.models import Canteen


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            if user.role == 'student':
                # Trigger 6-digit Email OTP via Gmail SMTP
                generate_and_send_otp(user)
                return Response({
                    'message': 'Registration successful. A 6-digit verification code has been sent to your email.',
                    'email': user.email,
                    'otp_required': True,
                }, status=status.HTTP_201_CREATED)

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserDetailSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    Accepts: { email, otp }
    Validates 6-digit OTP, activates user, and returns JWT auth tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email and 6-digit OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified and user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Account is already verified.',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserDetailSerializer(user).data,
            }, status=status.HTTP_200_OK)

        otp_record = EmailOTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
        if not otp_record:
            return Response({'error': 'No pending OTP verification found. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.attempts >= 5:
            otp_record.is_used = True
            otp_record.save()
            return Response({'error': 'Maximum verification attempts exceeded (5/5). Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.attempts += 1
        otp_record.save()

        if timezone.now() > otp_record.expires_at:
            otp_record.is_used = True
            otp_record.save()
            return Response({'error': 'This OTP has expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.otp_code != otp:
            remaining = 5 - otp_record.attempts
            return Response({
                'error': f'Invalid verification code. {remaining} attempt(s) remaining.',
                'remaining_attempts': remaining
            }, status=status.HTTP_400_BAD_REQUEST)

        # Valid OTP! Activate user
        otp_record.is_used = True
        otp_record.save()

        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=['is_email_verified', 'is_active', 'updated_at'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Email verified successfully! Welcome to CanteenX.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserDetailSerializer(user).data,
        }, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    """
    POST /api/auth/resend-otp/
    Accepts: { email }
    Resends 6-digit OTP with a 60-second cooldown.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified and user.is_active:
            return Response({'error': 'This account is already verified. Please log in.'}, status=status.HTTP_400_BAD_REQUEST)

        # 60s cooldown check
        latest_otp = EmailOTP.objects.filter(user=user).order_by('-created_at').first()
        if latest_otp:
            elapsed = (timezone.now() - latest_otp.created_at).total_seconds()
            if elapsed < 60:
                remaining = int(60 - elapsed)
                return Response({
                    'error': f'Please wait {remaining} seconds before requesting a new code.',
                    'retry_after': remaining
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        generate_and_send_otp(user)
        return Response({'message': 'A new 6-digit verification code has been sent to your email.'}, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'Logged out.'}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserDetailSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        return self.put(request)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not user.check_password(old_password):
            return Response({'old_password': ['Incorrect current password.']}, status=status.HTTP_400_BAD_REQUEST)

        if not new_password or len(new_password) < 6:
            return Response({'new_password': ['Password must be at least 6 characters long.']}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'confirm_password': ['Passwords do not match.']}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully.'})


class SuperAdminUserListView(generics.ListAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        role = self.request.query_params.get('role')
        qs = User.objects.all().order_by('-created_at')
        if role:
            qs = qs.filter(role=role)
        return qs


class SuperAdminToggleUserActiveView(APIView):
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = not user.is_active
            user.save()
            return Response(UserDetailSerializer(user).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class SuperAdminCreateCanteenAdminView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        email = request.data.get('email')
        full_name = request.data.get('full_name')
        password = request.data.get('password')
        mobile = request.data.get('mobile', '')
        canteen_id = request.data.get('canteen_id')

        if not email or not full_name or not password or not canteen_id:
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'email': ['Email already in use.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            canteen = Canteen.objects.get(id=canteen_id)
        except Canteen.DoesNotExist:
            return Response({'canteen_id': ['Canteen not found.']}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            mobile=mobile,
            role='canteen_admin'
        )
        CanteenAdminProfile.objects.create(user=user, canteen=canteen)
        return Response(UserDetailSerializer(user).data, status=status.HTTP_201_CREATED)


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Accepts: { email }
    Always returns 200 (prevents email enumeration).
    Sends a one-time reset link to the user's email.
    In dev (console backend), link prints to Django terminal.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Detect whether real SMTP is configured — returned to frontend to toggle dev tip
        is_console_backend = 'console' in settings.EMAIL_BACKEND.lower()
        email_mode = 'console' if is_console_backend else 'smtp'

        generic_response = Response(
            {
                'message': 'If an account exists with this email, a reset link has been sent.',
                'email_mode': email_mode,
            },
            status=status.HTTP_200_OK
        )
        email = request.data.get('email', '').strip().lower()
        if not email:
            return generic_response

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return generic_response

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"

        subject = "[CanteenX] Password Reset Request"
        text_body = (
            f"Hi {user.full_name},\n\n"
            f"Click the link below to reset your CanteenX password:\n"
            f"{reset_link}\n\n"
            f"This link expires in 1 hour and can only be used once.\n"
            f"If you did not request a password reset, please ignore this email.\n\n"
            f"CanteenX – Medi-Caps University"
        )
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:linear-gradient(135deg,#111827,#431407);padding:28px 32px;">
            <span style="font-size:22px;font-weight:800;color:#fff;">Canteen<span style="color:#f97316;">X</span></span>
            <p style="color:#fda172;font-size:11px;margin:4px 0 0;">Medi-Caps University, Indore</p>
          </div>
          <div style="padding:32px;">
            <h2 style="font-size:18px;color:#111827;margin:0 0 12px;">Password Reset Request</h2>
            <p style="color:#374151;font-size:14px;">Hi <strong>{user.full_name}</strong>,</p>
            <p style="color:#374151;font-size:14px;">We received a request to reset your CanteenX password. Click the button below to set a new password:</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="{reset_link}" style="background:#f97316;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color:#6b7280;font-size:12px;">Or copy this link into your browser:<br>
              <a href="{reset_link}" style="color:#ea580c;word-break:break-all;">{reset_link}</a>
            </p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
            <p style="color:#9ca3af;font-size:11px;">This link expires in <strong>1 hour</strong> and can only be used once.<br>
            If you did not request this, you can safely ignore this email.</p>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;text-align:center;">
            <p style="color:#9ca3af;font-size:11px;margin:0;">© {settings.USE_I18N and 'CanteenX'} CanteenX – Medi-Caps University Food Management System</p>
          </div>
        </div>
        """

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email]
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=True)
            # Always print link to console so dev can grab it even with SMTP active
            print(f"\n{'='*60}")
            print(f"[CanteenX Password Reset] Link for {email}:")
            print(f"  {reset_link}")
            print(f"{'='*60}\n")
            # Log to sent_emails.log if available
            try:
                from notifications.services import _log_email
                _log_email(email, subject, text_body)
            except Exception:
                pass
        except Exception as e:
            print(f"[Password Reset Email Error] {e}")

        return Response(
            {
                'message': 'If an account exists with this email, a reset link has been sent.',
                'email_mode': email_mode,
            },
            status=status.HTTP_200_OK
        )


class ResetPasswordConfirmView(APIView):
    """
    POST /api/auth/reset-password-confirm/
    Accepts: { uid, token, new_password, confirm_password }
    Returns 400 with clear errors if link invalid/expired or password weak.
    Returns 200 on success.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        # 1. Passwords match
        if new_password != confirm_password:
            return Response(
                {'confirm_password': ['Passwords do not match.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Decode uid → user
        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'token': ['Invalid or expired reset link.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Validate token (one-time, 1-hour expiry)
        if not default_token_generator.check_token(user, token):
            return Response(
                {'token': ['This reset link has already been used or has expired. Please request a new one.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Django password validators
        try:
            validate_password(new_password, user)
        except DjangoValidationError as exc:
            return Response(
                {'new_password': list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Save new password
        user.set_password(new_password)
        user.save()
        return Response(
            {'message': 'Password reset successful. You can now log in with your new password.'},
            status=status.HTTP_200_OK
        )
