import json
import os
import re
import urllib.error
import urllib.request
from django.conf import settings
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
    Natural language diet, budget, and break-time meal recommender powered by Groq LLM.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        query = (request.data.get('query') or '').strip()
        if not query:
            return Response({
                'reply': "Hello! I am your CanteenX AI Buddy 👨‍🍳. Ask me anything like:\n• 'I have ₹80 and 10 minutes, what can I eat?'\n• 'High-protein lunch under ₹150'\n• 'Refreshing beverage under ₹50'",
                'dishes': []
            })

        canteen_id = request.data.get('canteen_id')
        items_qs = FoodItem.objects.filter(is_available=True).select_related('category', 'canteen')
        if canteen_id:
            try:
                items_qs = items_qs.filter(canteen_id=int(canteen_id))
            except (ValueError, TypeError):
                pass

        all_items = list(items_qs)
        if not all_items:
            return Response({
                'reply': "Sorry, no food items are currently available in the selected canteen.",
                'dishes': []
            })

        groq_api_key = getattr(settings, 'GROQ_API_KEY', '') or os.environ.get('GROQ_API_KEY', '')

        # ── 1. Groq LLM Dispatch ──
        if groq_api_key:
            # Build compact menu representation (minimizes prompt token consumption)
            menu_lines = []
            for it in all_items:
                cat = it.category.name if it.category else 'General'
                diet = 'Veg' if it.is_veg else 'Non-Veg'
                menu_lines.append(f"[{it.id}] {it.name} - Rs.{it.price:.0f}, {it.preparation_time}m, {diet} ({cat})")
            menu_text = "\n".join(menu_lines)

            system_prompt = (
                "You are Chef Medi-Caps, the friendly AI food assistant for CanteenX university canteen.\n"
                "Given the student's question and the available campus menu, select 1 to 4 best matching dishes.\n"
                "Strictly respond ONLY in valid JSON matching this schema:\n"
                "{\n"
                '  "reply": "Friendly 1-2 sentence recommendation from Chef Medi-Caps explaining why these dishes fit",\n'
                '  "dish_ids": [list of integer IDs from the menu]\n'
                "}"
            )

            req_payload = json.dumps({
                "model": "qwen/qwen3.8-27b",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Available Menu:\n{menu_text}\n\nStudent: {query}"}
                ],
                "temperature": 0.3,
                "max_tokens": 250
            }).encode('utf-8')

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=req_payload,
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "CanteenX/1.0"
                },
                method="POST"
            )

            try:
                with urllib.request.urlopen(req, timeout=8) as resp:
                    resp_json = json.loads(resp.read().decode('utf-8'))
                    raw_content = resp_json['choices'][0]['message']['content'].strip()

                    # Extract JSON substring if wrapped in markdown code blocks
                    json_str = raw_content
                    if '```' in json_str:
                        parts = json_str.split('```')
                        for p in parts:
                            p_clean = p.strip()
                            if p_clean.startswith('json'):
                                p_clean = p_clean[4:].strip()
                            if p_clean.startswith('{') and p_clean.endswith('}'):
                                json_str = p_clean
                                break

                    data = json.loads(json_str)
                    reply_text = data.get('reply', '')
                    dish_ids = data.get('dish_ids', [])

                    if dish_ids and isinstance(dish_ids, list):
                        items_by_id = {it.id: it for it in all_items}
                        matched_dishes = [items_by_id[did] for did in dish_ids if did in items_by_id]
                        if matched_dishes:
                            return Response({
                                'reply': reply_text or "Here are my top recommendations for you:",
                                'dishes': FoodItemListSerializer(matched_dishes, many=True).data,
                                'suggested_queries': [
                                    "I have ₹80 & 10 minutes",
                                    "High-protein lunch under ₹150",
                                    "Quick snacks for 15-min break",
                                    "Cold drinks & coffee under ₹50"
                                ]
                            })
            except Exception as e:
                print(f"[Groq LLM Exception - Falling back to local heuristic]: {e}")

        # ── 2. Fallback Heuristic Scorer ──
        query_lower = query.lower()
        budget = None
        budget_match = re.search(r'(?:₹|rs\.?|inr|under|below|budget\s*of|less\s*than)?\s*(\d{2,4})\s*(?:₹|rs\.?|inr|rupees|bucks)?', query_lower)
        if budget_match:
            try:
                candidate = int(budget_match.group(1))
                if 10 <= candidate <= 2000:
                    budget = candidate
            except ValueError:
                pass

        max_time = None
        time_match = re.search(r'(\d{1,3})\s*(?:min|mins|minute|minutes|m)\b', query_lower)
        if time_match:
            try:
                candidate_time = int(time_match.group(1))
                if 2 <= candidate_time <= 120:
                    max_time = candidate_time
            except ValueError:
                pass

        is_protein = any(k in query_lower for k in ['protein', 'gym', 'workout', 'fit', 'healthy', 'diet'])
        is_sweet = any(k in query_lower for k in ['sweet', 'dessert', 'ice cream', 'cake', 'sugar', 'mithai'])
        is_beverage = any(k in query_lower for k in ['beverage', 'drink', 'shake', 'juice', 'coffee', 'tea', 'chai', 'lassi'])
        is_snack = any(k in query_lower for k in ['snack', 'quick', 'fast', 'recess', 'break', 'poha', 'samosa', 'kachori', 'sandwich', 'maggi'])
        is_meal = any(k in query_lower for k in ['lunch', 'dinner', 'thali', 'meal', 'heavy', 'rice', 'roti', 'combo', 'chole', 'paratha'])
        is_veg_only = any(k in query_lower for k in ['veg', 'vegetarian', 'pure veg', 'shakahari'])

        filtered = all_items
        if is_veg_only:
            filtered = [it for it in filtered if it.is_veg]
        if budget is not None:
            filtered = [it for it in filtered if it.price <= budget]
        if max_time is not None:
            filtered = [it for it in filtered if it.preparation_time <= max_time]

        scores = {}
        for item in filtered:
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
            score += min(item.total_orders, 10)
            scores[item.id] = score

        ranked_items = sorted(filtered, key=lambda it: (-scores.get(it.id, 0), it.preparation_time, it.price))[:4]

        if not ranked_items:
            reply = f"I couldn't find any items directly matching your criteria ({f'under ₹{budget}' if budget else ''} {f'ready in {max_time} mins' if max_time else ''}). Try browsing our full menu!"
        else:
            first_pick = ranked_items[0]
            reply = f"👨‍🍳 I recommend the **{first_pick.name}** (₹{first_pick.price:.0f}, ~{first_pick.preparation_time}m). Click below to add directly to your food tray:"

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
