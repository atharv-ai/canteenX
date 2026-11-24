import re
from django.db.models import Q
from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FoodCategory, FoodItem
from .serializers import FoodCategorySerializer, FoodItemSerializer, FoodItemListSerializer
from accounts.permissions import IsCanteenAdmin


class FoodCategoryListView(generics.ListAPIView):
    serializer_class = FoodCategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        canteen_id = self.request.query_params.get('canteen')
        qs = FoodCategory.objects.filter(is_active=True)
        if canteen_id:
            qs = qs.filter(canteen_id=canteen_id)
        return qs


class FoodCategoryCreateView(generics.CreateAPIView):
    serializer_class = FoodCategorySerializer
    permission_classes = [IsCanteenAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'canteen_admin':
            canteen = user.canteen_admin_profile.canteen
            serializer.save(canteen=canteen)
        else:
            from canteens.models import Canteen
            canteen_id = self.request.data.get('canteen')
            canteen = Canteen.objects.filter(id=canteen_id).first() if canteen_id else Canteen.objects.first()
            serializer.save(canteen=canteen)


class FoodCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodCategorySerializer
    permission_classes = [IsCanteenAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return FoodCategory.objects.all()
        elif user.role == 'canteen_admin':
            return FoodCategory.objects.filter(canteen=user.canteen_admin_profile.canteen)
        return FoodCategory.objects.none()


class FoodItemListView(generics.ListAPIView):
    serializer_class = FoodItemListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'name', 'total_orders']

    def get_queryset(self):
        qs = FoodItem.objects.filter(is_available=True).select_related('canteen', 'category')
        canteen_id = self.request.query_params.get('canteen')
        category_id = self.request.query_params.get('category')
        is_veg = self.request.query_params.get('is_veg')
        is_featured = self.request.query_params.get('is_featured')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if canteen_id:
            qs = qs.filter(canteen_id=canteen_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if is_veg is not None and is_veg != '':
            qs = qs.filter(is_veg=is_veg.lower() in ['true', '1'])
        if is_featured is not None and is_featured != '':
            qs = qs.filter(is_featured=is_featured.lower() in ['true', '1'])
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs


class FoodItemDetailView(generics.RetrieveAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [AllowAny]
    queryset = FoodItem.objects.all()


class FoodItemCreateView(generics.CreateAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [IsCanteenAdmin]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'canteen_admin':
            canteen = user.canteen_admin_profile.canteen
            serializer.save(canteen=canteen)
        else:
            from canteens.models import Canteen
            canteen_id = self.request.data.get('canteen')
            canteen = Canteen.objects.filter(id=canteen_id).first() if canteen_id else Canteen.objects.first()
            serializer.save(canteen=canteen)


class FoodItemUpdateView(generics.UpdateAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [IsCanteenAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return FoodItem.objects.all()
        elif user.role == 'canteen_admin':
            return FoodItem.objects.filter(canteen=user.canteen_admin_profile.canteen)
        return FoodItem.objects.none()


class FoodItemDeleteView(generics.DestroyAPIView):
    serializer_class = FoodItemSerializer
    permission_classes = [IsCanteenAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return FoodItem.objects.all()
        elif user.role == 'canteen_admin':
            return FoodItem.objects.filter(canteen=user.canteen_admin_profile.canteen)
        return FoodItem.objects.none()


class AdminFoodItemListView(generics.ListAPIView):
    """List all items for canteen admin (including unavailable)"""
    serializer_class = FoodItemSerializer
    permission_classes = [IsCanteenAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'canteen_admin':
            return FoodItem.objects.filter(canteen=user.canteen_admin_profile.canteen)
        elif user.role == 'super_admin':
            canteen_id = self.request.query_params.get('canteen')
            if canteen_id:
                return FoodItem.objects.filter(canteen_id=canteen_id)
            return FoodItem.objects.all()
        return FoodItem.objects.none()


class AdminCategoryListView(generics.ListAPIView):
    """List all categories for canteen admin"""
    serializer_class = FoodCategorySerializer
    permission_classes = [IsCanteenAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'canteen_admin':
            return FoodCategory.objects.filter(canteen=user.canteen_admin_profile.canteen)
        elif user.role == 'super_admin':
            return FoodCategory.objects.all()
        return FoodCategory.objects.none()


class AIBuddyView(APIView):
    """
    POST /api/food/ai-buddy/
    Natural language diet, budget, and break-time meal recommender.
    Accepts prompts like:
      - "I have Rs. 80 and 10 minutes, what can I eat?"
      - "High-protein lunch under 150"
      - "Quick snacks for 15 min recess"
      - "Something sweet and refreshing"
    """
    permission_classes = [AllowAny]

    def post(self, request):
        query = (request.data.get('query') or '').strip().lower()
        if not query:
            return Response({
                'reply': "Hello! I am your CanteenX AI Buddy 👨‍🍳. Ask me anything like:\n• 'I have ₹80 and 10 minutes, what can I eat?'\n• 'High-protein lunch under ₹150'\n• 'Refreshing beverage under ₹50'",
                'dishes': []
            })

        canteen_id = request.data.get('canteen_id')
        qs = FoodItem.objects.filter(is_available=True)
        if canteen_id:
            qs = qs.filter(canteen_id=canteen_id)

        # 1. Extract Budget
        budget = None
        budget_match = re.search(r'(?:₹|rs\.?|inr|under|below|budget\s*of|less\s*than)?\s*(\d{2,4})\s*(?:₹|rs\.?|inr|rupees|bucks)?', query)
        if budget_match:
            try:
                candidate = int(budget_match.group(1))
                if 10 <= candidate <= 2000:
                    budget = candidate
            except ValueError:
                pass

        # 2. Extract Preparation Time
        max_time = None
        time_match = re.search(r'(\d{1,3})\s*(?:min|mins|minute|minutes|m)\b', query)
        if time_match:
            try:
                candidate_time = int(time_match.group(1))
                if 2 <= candidate_time <= 120:
                    max_time = candidate_time
            except ValueError:
                pass

        # 3. Categorize Dietary and Theme Preferences
        is_protein = any(k in query for k in ['protein', 'gym', 'workout', 'fit', 'healthy', 'diet'])
        is_sweet = any(k in query for k in ['sweet', 'dessert', 'ice cream', 'cake', 'sugar', 'mithai'])
        is_beverage = any(k in query for k in ['beverage', 'drink', 'shake', 'juice', 'coffee', 'tea', 'chai', 'lassi'])
        is_snack = any(k in query for k in ['snack', 'quick', 'fast', 'recess', 'break', 'poha', 'samosa', 'kachori', 'sandwich', 'maggi'])
        is_meal = any(k in query for k in ['lunch', 'dinner', 'thali', 'meal', 'heavy', 'rice', 'roti', 'combo', 'chole', 'paratha'])
        is_veg_only = any(k in query for k in ['veg', 'vegetarian', 'pure veg', 'shakahari'])

        if is_veg_only:
            qs = qs.filter(is_veg=True)

        if budget is not None:
            qs = qs.filter(price__lte=budget)

        if max_time is not None:
            qs = qs.filter(preparation_time__lte=max_time)

        # 4. Keyword Scoring and Ranking
        scores = {}
        for item in qs:
            score = 0
            name_desc = f"{item.name} {item.description}".lower()
            cat_name = item.category.name.lower() if item.category else ""

            if is_protein and any(k in name_desc for k in ['paneer', 'egg', 'chicken', 'soya', 'chana', 'dal', 'sprouts', 'protein', 'curd', 'milk']):
                score += 15
            if is_sweet and (any(k in name_desc for k in ['sweet', 'chocolate', 'ice cream', 'halwa', 'gulab jamun']) or 'dessert' in cat_name):
                score += 15
            if is_beverage and (any(k in name_desc for k in ['coffee', 'tea', 'chai', 'shake', 'juice', 'lassi', 'smoothie']) or 'beverage' in cat_name):
                score += 15
            if is_snack and (any(k in name_desc for k in ['poha', 'samosa', 'kachori', 'sandwich', 'puff', 'maggi', 'toast', 'chaat', 'bhel']) or 'snack' in cat_name):
                score += 12
            if is_meal and (any(k in name_desc for k in ['thali', 'rice', 'roti', 'chole', 'paneer', 'paratha', 'biryani', 'dal makhani']) or 'meal' in cat_name):
                score += 12

            if item.is_featured:
                score += 4
            score += min(item.total_orders, 10)  # popularity bump
            scores[item.id] = score

        # Sort by relevance score, then preparation time, then price
        ranked_items = sorted(qs, key=lambda it: (-scores.get(it.id, 0), it.preparation_time, it.price))[:4]

        # 5. Build Conversational Response
        if not ranked_items:
            reply = f"I couldn't find any items directly matching your criteria ({f'under ₹{budget}' if budget else ''} {f'ready in {max_time} mins' if max_time else ''}). Try increasing your budget or checking our full menu!"
        else:
            intro_phrases = []
            if budget and max_time:
                intro_phrases.append(f"Ready in under **{max_time} minutes** and within your **₹{budget}** budget")
            elif budget:
                intro_phrases.append(f"Delicious dishes under your **₹{budget}** budget")
            elif max_time:
                intro_phrases.append(f"Super quick picks ready in **{max_time} minutes or less**")
            elif is_protein:
                intro_phrases.append("Nutritious and protein-packed favorites from our counter")
            elif is_beverage or is_sweet:
                intro_phrases.append("Refreshing beverages and treats to recharge your day")
            else:
                intro_phrases.append("Here are my top student-favorite recommendations")

            first_pick = ranked_items[0]
            summary_desc = f"I especially recommend the **{first_pick.name}** (₹{first_pick.price:.0f}, ready in ~{first_pick.preparation_time}m)."
            if len(ranked_items) > 1 and budget and (ranked_items[0].price + ranked_items[1].price <= budget):
                combo_cost = ranked_items[0].price + ranked_items[1].price
                combo_desc = f" You can even pair it with **{ranked_items[1].name}** for a full combo at just ₹{combo_cost:.0f}!"
            else:
                combo_desc = ""

            reply = f"👨‍🍳 {intro_phrases[0]}! {summary_desc}{combo_desc} Click below to add directly to your food tray:"

        serializer = FoodItemListSerializer(ranked_items, many=True)

        return Response({
            'reply': reply,
            'budget': budget,
            'max_time': max_time,
            'dishes': serializer.data,
            'suggested_queries': [
                "I have ₹80 & 10 minutes",
                "High-protein lunch under ₹150",
                "Quick snacks for 15-min break",
                "Cold drinks & coffee under ₹50"
            ]
        }, status=status.HTTP_200_OK)
