import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import StudentProfile, CanteenAdminProfile
from canteens.models import Canteen
from menu.models import FoodCategory, FoodItem

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial data for Medi-Caps University CanteenX application'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting initial data seeding for CanteenX...'))

        # 1. Super Admin
        super_admin_email = 'admin@medicaps.ac.in'
        if not User.objects.filter(email=super_admin_email).exists():
            super_admin = User.objects.create_superuser(
                email=super_admin_email,
                full_name='Medi-Caps Super Admin',
                password='Admin@123',
                mobile='9876543210'
            )
            self.stdout.write(self.style.SUCCESS(f'Created Super Admin: {super_admin_email} / Admin@123'))
        else:
            self.stdout.write('Super Admin already exists.')

        # 2. Main Canteen
        canteen, created = Canteen.objects.get_or_create(
            name='Medi-Caps Central Canteen',
            defaults={
                'description': 'The primary student and faculty food court serving fresh, hygienic, and affordable meals across all university departments.',
                'location': 'Ground Floor, Block B, Medi-Caps University Campus, AB Road, Indore, MP 453331',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Canteen: {canteen.name}'))

        # Secondary Canteen for multi-canteen demonstration
        canteen2 = Canteen.objects.filter(name__in=['Cafine', 'Engineering Block Cafeteria']).first()
        if not canteen2:
            canteen2 = Canteen.objects.create(
                name='Cafine',
                description='Specialty cafe, artisan hot brews, burgers, subs, grilled toasts, pizzas and creamy shakes at Engineering Block, Medi-Caps University.',
                location='Engineering Block, Medi-Caps University Campus, AB Road, Indore',
                is_active=True,
            )
        else:
            canteen2.name = 'Cafine'
            canteen2.description = 'Specialty cafe, artisan hot brews, burgers, subs, grilled toasts, pizzas and creamy shakes at Engineering Block, Medi-Caps University.'
            canteen2.location = 'Engineering Block, Medi-Caps University Campus, AB Road, Indore'
            canteen2.is_active = True
            canteen2.save()

        # 3. Central Canteen Admin
        canteen_admin_email = 'canteen@medicaps.ac.in'
        admin_user, _ = User.objects.get_or_create(
            email=canteen_admin_email,
            defaults={
                'full_name': 'Central Canteen Manager',
                'mobile': '9826012345',
                'role': 'canteen_admin',
                'is_staff': True,
                'is_active': True,
                'is_email_verified': True,
            }
        )
        admin_user.set_password('Canteen@123')
        admin_user.role = 'canteen_admin'
        admin_user.is_staff = True
        admin_user.is_active = True
        admin_user.is_email_verified = True
        admin_user.save()
        CanteenAdminProfile.objects.update_or_create(user=admin_user, defaults={'canteen': canteen})
        self.stdout.write(self.style.SUCCESS(f'Verified Central Canteen Admin: {canteen_admin_email} / Canteen@123'))

        # 3b. Cafine Admin
        cafine_emails = ['cafine@medicaps.ac.in', 'engg.canteen@medicaps.ac.in']
        for c_email in cafine_emails:
            cafine_admin, _ = User.objects.get_or_create(
                email=c_email,
                defaults={
                    'full_name': 'Cafine Engineering Manager',
                    'mobile': '9826099887',
                    'role': 'canteen_admin',
                    'is_staff': True,
                    'is_active': True,
                    'is_email_verified': True,
                }
            )
            cafine_admin.set_password('Cafine@123')
            cafine_admin.role = 'canteen_admin'
            cafine_admin.is_staff = True
            cafine_admin.is_active = True
            cafine_admin.is_email_verified = True
            cafine_admin.save()
            CanteenAdminProfile.objects.update_or_create(user=cafine_admin, defaults={'canteen': canteen2})
            self.stdout.write(self.style.SUCCESS(f'Verified Cafine Admin: {c_email} / Cafine@123'))

        # 4. Sample Student
        student_email = 'student@medicaps.ac.in'
        if not User.objects.filter(email=student_email).exists():
            student_user = User.objects.create_user(
                email=student_email,
                full_name='Atharv Sharma',
                password='Student@123',
                mobile='9893011223',
                role='student',
                is_active=True,
                is_email_verified=True,
            )
            StudentProfile.objects.create(user=student_user, enrollment_number='EN2024CS001')
            self.stdout.write(self.style.SUCCESS(f'Created Demo Student: {student_email} / Student@123'))
        else:
            self.stdout.write('Demo Student already exists.')

        # Ensure all existing seeded accounts are verified and active
        User.objects.filter(email__in=[
            'admin@medicaps.ac.in',
            'canteen@medicaps.ac.in',
            'cafine@medicaps.ac.in',
            'student@medicaps.ac.in'
        ]).update(is_email_verified=True, is_active=True)

        # 5. Food Categories
        categories_data = [
            {'name': 'Indori Breakfast', 'order': 1, 'description': 'Authentic morning specialties from Indore'},
            {'name': 'Lunch & Thali', 'order': 2, 'description': 'Wholesome North Indian and campus meal combos'},
            {'name': 'Fast Food & Snacks', 'order': 3, 'description': 'Burgers, sandwiches, noodles and evening quick bites'},
            {'name': 'Beverages & Shakes', 'order': 4, 'description': 'Chai, cold coffee, juices and refreshing coolers'},
            {'name': 'Desserts & Sweets', 'order': 5, 'description': 'Delicious traditional sweets and bakery treats'},
        ]

        cat_objs = {}
        for cat_info in categories_data:
            cat, _ = FoodCategory.objects.get_or_create(
                canteen=canteen,
                name=cat_info['name'],
                defaults={'order': cat_info['order'], 'description': cat_info['description'], 'is_active': True}
            )
            cat_objs[cat.name] = cat

        # 6. Food Items
        items_data = [
            # Breakfast
            {
                'category': 'Indori Breakfast',
                'name': 'Indori Sev Usal Poha',
                'description': 'Famous Indore style soft spiced flattened rice topped with crunchy Ratlami sev, onions, coriander and jeeravan.',
                'price': Decimal('35.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 5,
                'stock_quantity': 150,
            },
            {
                'category': 'Indori Breakfast',
                'name': 'Crispy Samosa with Chutney (2 Pcs)',
                'description': 'Hot crispy pastry stuffed with spiced potato and green peas, served with sweet tamarind and spicy mint chutneys.',
                'price': Decimal('30.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 5,
                'stock_quantity': 80,
            },
            {
                'category': 'Indori Breakfast',
                'name': 'South Indian Masala Dosa',
                'description': 'Thin golden crepe stuffed with spiced potato mash, served with coconut chutney and hot vegetable sambar.',
                'price': Decimal('75.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 12,
                'stock_quantity': 60,
            },
            {
                'category': 'Indori Breakfast',
                'name': 'Steamed Idli Sambhar (2 Pcs)',
                'description': 'Fluffy steamed rice and lentil cakes served with piping hot authentic sambar and fresh coconut dip.',
                'price': Decimal('50.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 6,
                'stock_quantity': 50,
            },
            {
                'category': 'Indori Breakfast',
                'name': 'Stuffed Aloo Paratha with Curd & Pickle',
                'description': 'Tawa grilled whole wheat flatbread loaded with spiced potato filling, served with fresh curd and mixed pickle.',
                'price': Decimal('60.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 10,
                'stock_quantity': 45,
            },

            # Lunch & Thali
            {
                'category': 'Lunch & Thali',
                'name': 'Medi-Caps Special Royal Thali',
                'description': 'Complete balanced meal with Shahi Paneer, Dal Makhani, 4 Butter Phulkas, Jeera Rice, Cucumber Raita, Papad, Salad & Gulab Jamun.',
                'price': Decimal('130.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 15,
                'stock_quantity': 100,
            },
            {
                'category': 'Lunch & Thali',
                'name': 'Executive Student Mini Thali',
                'description': 'Everyday campus special: Dal Tadka, Seasonal Mix Veg Curry, 4 Tawa Rotis, Plain Rice, and Fresh Green Salad.',
                'price': Decimal('80.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 10,
                'stock_quantity': 120,
            },
            {
                'category': 'Lunch & Thali',
                'name': 'Paneer Butter Masala with 3 Butter Naan',
                'description': 'Rich cottage cheese cubes simmered in velvety tomato cashew gravy, served with fluffy buttered naan.',
                'price': Decimal('145.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 15,
                'stock_quantity': 40,
            },
            {
                'category': 'Lunch & Thali',
                'name': 'Punjabi Chole Bhature (2 Large Bhature)',
                'description': 'Spicy chickpea curry cooked with aromatic spices, paired with two balloon puffed bhaturas, pickled onions, and green chilies.',
                'price': Decimal('90.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 12,
                'stock_quantity': 75,
            },
            {
                'category': 'Lunch & Thali',
                'name': 'Yellow Dal Fry with Jeera Rice Bowl',
                'description': 'Homestyle yellow toor lentil tempered with cumin, garlic and ghee, served over fragrant basmati jeera rice.',
                'price': Decimal('85.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 10,
                'stock_quantity': 60,
            },

            # Fast Food & Snacks
            {
                'category': 'Fast Food & Snacks',
                'name': 'Grilled Jumbo Cheese Sandwich',
                'description': 'Triple layer grilled sandwich with capsicum, tomatoes, sweet corn, melted mozzarella, and oregano seasoning.',
                'price': Decimal('70.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 8,
                'stock_quantity': 70,
            },
            {
                'category': 'Fast Food & Snacks',
                'name': 'Crispy Veg Patty Burger with Fries',
                'description': 'Crisp spiced veggie patty with fresh lettuce, sliced tomatoes, creamy chipotle mayo, served with salted potato fries.',
                'price': Decimal('85.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 10,
                'stock_quantity': 50,
            },
            {
                'category': 'Fast Food & Snacks',
                'name': 'Veg Hakka Noodles',
                'description': 'Wok tossed noodles loaded with crunchy cabbage, bell peppers, carrots, spring onions, and oriental sauces.',
                'price': Decimal('80.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 10,
                'stock_quantity': 60,
            },
            {
                'category': 'Fast Food & Snacks',
                'name': 'Veg Manchurian Dry (8 Pcs)',
                'description': 'Crispy vegetable florets tossed in zesty ginger, garlic, soy, and dark chili glaze topped with spring onions.',
                'price': Decimal('90.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 12,
                'stock_quantity': 45,
            },

            # Beverages & Shakes
            {
                'category': 'Beverages & Shakes',
                'name': 'Indori Kadak Masala Chai',
                'description': 'Traditional brewed milk tea infused with crushed ginger, green cardamom, cloves, and Indian spices.',
                'price': Decimal('15.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 3,
                'stock_quantity': 300,
            },
            {
                'category': 'Beverages & Shakes',
                'name': 'Thick Cold Coffee with Chocolate Ice Cream',
                'description': 'Chilled creamy blended coffee topped with a rich scoop of chocolate ice cream and Hershey drizzle.',
                'price': Decimal('60.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 5,
                'stock_quantity': 80,
            },
            {
                'category': 'Beverages & Shakes',
                'name': 'Sweet Lassi (Indori Kulhad)',
                'description': 'Traditional churned yogurt cooler served thick with a crown of clotted malai and chopped pistachios.',
                'price': Decimal('45.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 4,
                'stock_quantity': 50,
            },
            {
                'category': 'Beverages & Shakes',
                'name': 'Fresh Mint Lemonade Soda',
                'description': 'Fizzy refreshing soda with freshly squeezed Indore lemons, crushed mint leaves, rock salt, and cumin.',
                'price': Decimal('35.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 3,
                'stock_quantity': 100,
            },

            # Desserts
            {
                'category': 'Desserts & Sweets',
                'name': 'Hot Gulab Jamun in Saffron Syrup (2 Pcs)',
                'description': 'Golden fried mawa dumplings soaked in cardamom and saffron flavored sugar syrup. Served warm.',
                'price': Decimal('40.00'),
                'is_veg': True,
                'is_featured': True,
                'preparation_time': 3,
                'stock_quantity': 60,
            },
            {
                'category': 'Desserts & Sweets',
                'name': 'Warm Chocolate Walnut Brownie',
                'description': 'Fudgy chocolate brownie loaded with toasted walnuts and drizzled with warm dark chocolate ganache.',
                'price': Decimal('75.00'),
                'is_veg': True,
                'is_featured': False,
                'preparation_time': 4,
                'stock_quantity': 35,
            },
        ]

        created_count = 0
        for item_info in items_data:
            cat = cat_objs.get(item_info['category'])
            item, was_created = FoodItem.objects.get_or_create(
                canteen=canteen,
                name=item_info['name'],
                defaults={
                    'category': cat,
                    'description': item_info['description'],
                    'price': item_info['price'],
                    'is_veg': item_info['is_veg'],
                    'is_featured': item_info['is_featured'],
                    'preparation_time': item_info['preparation_time'],
                    'stock_quantity': item_info['stock_quantity'],
                    'is_available': True,
                }
            )
            if was_created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded {created_count} food items successfully!'))

        # 6. Seed Cafine Categories and Menu Items
        self.stdout.write(self.style.NOTICE("Seeding Cafine (Engineering Block) Menu & Categories..."))

        cafine_categories_def = [
            ('Hot Beverages', 1, 'Freshly brewed chai, espresso, and warming teas'),
            ('Burger & Sub', 2, 'Gourmet burgers and subs grilled with signature sauces and fillings'),
            ('Cold Beverages', 3, 'Iced teas, cold coffees, coolers, limewater and sodas'),
            ('Mojito', 4, 'Refreshing fizzy fruit and mint mocktails'),
            ('Paratha', 5, 'Tawa and tandoori parathas served fresh'),
            ('Sandwich', 6, 'Grilled and toasted sandwiches packed with cheese and fillings'),
            ('Pizza', 7, 'Fresh-baked thin crust and pan pizzas with mozzarella'),
            ('Garlic Bread And Toast', 8, 'Crunchy garlic breads, cheesy toasts, and snacks'),
            ('Soups', 9, 'Hot comforting bowls of soup'),
            ('Pasta', 10, 'Creamy Italian pastas tossed in aromatic herbs'),
            ('Maggi', 11, 'Campus favorite Maggi variants loaded with toppings'),
            ('Fries', 12, 'Golden crispy potato fries seasoned to perfection'),
            ('Milkshakes', 13, 'Thick creamy milkshakes blended with chocolate and fruit'),
            ('Happiness & Bakery', 14, 'Brownies, samosas, bread butter and sweet treats'),
        ]

        cafine_cats = {}
        for cat_name, order, desc in cafine_categories_def:
            c_obj, _ = FoodCategory.objects.get_or_create(
                canteen=canteen2,
                name=cat_name,
                defaults={'order': order, 'description': desc, 'is_active': True}
            )
            cafine_cats[cat_name] = c_obj

        cafine_items_data = [
            # Hot Beverages
            ('Tea (Small)', 'Hot Beverages', Decimal('10.00'), 'Fresh hot Indian spiced cutting tea.', True, 5),
            ('Tea (Big)', 'Hot Beverages', Decimal('15.00'), 'Large cup of premium aromatic milk tea.', True, 5),
            ('Coffee (Small)', 'Hot Beverages', Decimal('25.00'), 'Rich hot roasted milk coffee.', True, 5),
            ('Coffee (Big)', 'Hot Beverages', Decimal('50.00'), 'Large frothy aromatic milk coffee.', True, 5),
            ('Hot Lemon Tea (Small)', 'Hot Beverages', Decimal('30.00'), 'Invigorating black tea with fresh lemon zest.', True, 5),
            ('Hot Lemon Tea (Big)', 'Hot Beverages', Decimal('50.00'), 'Large hot lemon tea infused with citrus herbs.', True, 5),
            ('Black Coffee (Small)', 'Hot Beverages', Decimal('30.00'), 'Intense dark roast Americano espresso.', True, 5),
            ('Black Coffee (Big)', 'Hot Beverages', Decimal('50.00'), 'Double shot rich Americano black coffee.', True, 5),
            ('Add Hazelnut Syrup', 'Hot Beverages', Decimal('15.00'), 'Flavor shot of nutty Italian hazelnut syrup.', True, 2),

            # Burger & Sub
            ('Classic Burger', 'Burger & Sub', Decimal('50.00'), 'Golden veggie patty, fresh tomato, crisp lettuce & mayo.', True, 10),
            ('Peri Peri Burger', 'Burger & Sub', Decimal('75.00'), 'Spicy peri-peri seasoned patty with fiery chipotle sauce.', True, 10),
            ('Cheese Burger', 'Burger & Sub', Decimal('65.00'), 'Melted cheddar slice over savory vegetable patty.', True, 10),
            ('Tandoori Burger', 'Burger & Sub', Decimal('75.00'), 'Smoky tandoori paneer patty with mint mayo and onions.', True, 10),
            ('Salad Sub', 'Burger & Sub', Decimal('95.00'), 'Fresh bell peppers, cucumbers, lettuce, olives & vinaigrette.', True, 10),
            ('Mexican Sub', 'Burger & Sub', Decimal('100.00'), 'Zesty Mexican bean patty, jalapeños, salsa and cheese.', True, 10),
            ('Paneer Sub', 'Burger & Sub', Decimal('115.00'), 'Marinated spiced paneer cubes, crunchy veggies & mayo.', True, 12),
            ('Schezwan Sub', 'Burger & Sub', Decimal('115.00'), 'Spicy Schezwan tossed filling with garlic and peppers.', True, 12),

            # Cold Beverages
            ('Lemon Ice Tea', 'Cold Beverages', Decimal('55.00'), 'Chilled brewed iced tea with lemon and crushed mint.', True, 5),
            ('Peach Ice Tea', 'Cold Beverages', Decimal('70.00'), 'Sweet aromatic peach iced tea served super chilled.', True, 5),
            ('Cold Coffee', 'Cold Beverages', Decimal('70.00'), 'Classic creamy blended iced coffee.', True, 5),
            ('Cold Chocolate', 'Cold Beverages', Decimal('75.00'), 'Decadent rich dark cocoa iced drink.', True, 5),
            ('Cold Coffee With Ice Cream', 'Cold Beverages', Decimal('100.00'), 'Thick cold coffee crowned with a vanilla scoop.', True, 6),
            ('Limewater', 'Cold Beverages', Decimal('20.00'), 'Hydrating fresh lime water sweet or salted.', True, 3),
            ('Lime Soda', 'Cold Beverages', Decimal('30.00'), 'Sparkling soda with fresh lime juice and black salt.', True, 3),
            ('Hazelnut Cold Coffee', 'Cold Beverages', Decimal('85.00'), 'Cold coffee infused with hazelnut syrup shot.', True, 5),

            # Mojito
            ('Mint Mojito', 'Mojito', Decimal('70.00'), 'Crushed fresh garden mint, lemon wedges, and soda.', True, 5),
            ('Peach Mojito', 'Mojito', Decimal('75.00'), 'Juicy sweet peach infused fizzy cooler.', True, 5),
            ('Green Apple Mojito', 'Mojito', Decimal('75.00'), 'Crisp tangy green apple cooler with bubbly soda.', True, 5),

            # Paratha
            ('Aloo Paratha', 'Paratha', Decimal('70.00'), 'Whole wheat flatbread stuffed with spiced mashed potatoes.', True, 12),
            ('Paneer Paratha', 'Paratha', Decimal('80.00'), 'Grated fresh cottage cheese stuffed paratha with butter.', True, 12),
            ('Sev Paratha', 'Paratha', Decimal('65.00'), 'Authentic Indore crispy sev and onion stuffed paratha.', True, 10),

            # Sandwich
            ('Masala Grill Sandwich', 'Sandwich', Decimal('50.00'), 'Spiced potato filling grilled golden in butter.', True, 10),
            ('Cheese Chutney Sandwich', 'Sandwich', Decimal('60.00'), 'Spicy coriander-mint chutney with gooey melted cheese.', True, 10),
            ('Cheese Corn Sandwich', 'Sandwich', Decimal('65.00'), 'Sweet golden corn kernels mixed with melted mozzarella.', True, 10),
            ('Veg Cheese Sandwich', 'Sandwich', Decimal('75.00'), 'Sliced garden veggies and cheese grilled crisp.', True, 10),
            ('Chilly Paneer Sandwich', 'Sandwich', Decimal('85.00'), 'Wok-tossed chilli paneer slices packed in bread.', True, 10),
            ('Paneer Tikka Sandwich', 'Sandwich', Decimal('85.00'), 'Smoky paneer tikka chunks with capsicum and cheese.', True, 10),

            # Pizza
            ('Cheese Pizza', 'Pizza', Decimal('80.00'), 'Classic 7-inch crust loaded with 100% mozzarella cheese.', True, 15),
            ('Cheese Corn Pizza', 'Pizza', Decimal('90.00'), 'Golden sweet corn sprinkled over rich tomato sauce & cheese.', True, 15),
            ('Onion Paneer Pizza', 'Pizza', Decimal('99.00'), 'Crisp onions and fresh spiced paneer cubes on pizza sauce.', True, 15),
            ('Chilly Paneer Pizza', 'Pizza', Decimal('115.00'), 'Spicy chilli paneer cubes over melted mozzarella.', True, 15),
            ('Makhni Paneer Pizza', 'Pizza', Decimal('115.00'), 'Creamy makhni gravy base topped with paneer & cheese.', True, 15),
            ('Paneer Tikka Pizza', 'Pizza', Decimal('115.00'), 'Tandoori paneer tikka chunks, capsicum & cheese.', True, 15),

            # Garlic Bread And Toast
            ('Cheesy Garlic Bread', 'Garlic Bread And Toast', Decimal('60.00'), 'Crisp French bread baked with garlic butter & cheese.', True, 10),
            ('Pizza Toast', 'Garlic Bread And Toast', Decimal('50.00'), 'Toasted bread topped with pizza sauce, veggies and cheese.', True, 10),
            ('Cheese Chilly Toast', 'Garlic Bread And Toast', Decimal('60.00'), 'Finely chopped green chillies and molten cheese toast.', True, 10),
            ('Chilly Garlic Bread', 'Garlic Bread And Toast', Decimal('85.00'), 'Spicy garlic butter rubbed bread with chilli flakes.', True, 10),

            # Soups
            ('Tomato Soup', 'Soups', Decimal('30.00'), 'Silky ripe tomato soup served with crispy croutons.', True, 8),
            ('Corn Soup', 'Soups', Decimal('30.00'), 'Sweet corn broth with diced veggies and white pepper.', True, 8),
            ('Manchow Soup', 'Soups', Decimal('30.00'), 'Spicy Indo-Chinese dark soup topped with crispy fried noodles.', True, 8),

            # Pasta
            ('White Sauce Pasta', 'Pasta', Decimal('80.00'), 'Penne pasta tossed in rich cheesy béchamel white sauce.', True, 12),
            ('Red Sauce Pasta', 'Pasta', Decimal('80.00'), 'Tangy herb tomato marinara pasta with bell peppers.', True, 12),
            ('Mix Sauce Pasta', 'Pasta', Decimal('90.00'), 'Pink sauce blend of creamy white and tangy arrabbiata sauces.', True, 12),

            # Maggi
            ('Masala Maggi', 'Maggi', Decimal('40.00'), 'Loaded with extra Indian spices, onions, and tomatoes.', True, 8),
            ('Cheese Maggi', 'Maggi', Decimal('60.00'), 'Decadent creamy Maggi draped in gooey melted cheese.', True, 8),
            ('Veggie Chilly Garlic Maggi', 'Maggi', Decimal('50.00'), 'Spiced up with crushed garlic, veggies and red chilli oil.', True, 8),
            ('Butter Garlic Maggi', 'Maggi', Decimal('50.00'), 'Rich butter sautéed garlic infused aromatic Maggi.', True, 8),

            # Fries
            ('Salted / Masala Fries', 'Fries', Decimal('60.00'), 'Deep fried potato batons dusted with chaat masala or sea salt.', True, 8),
            ('Peri Peri / Cheese Fries', 'Fries', Decimal('75.00'), 'Crispy French fries tossed in fiery peri-peri and melted cheese.', True, 8),

            # Milkshakes
            ('Classic Milkshake', 'Milkshakes', Decimal('50.00'), 'Chilled creamy vanilla / chocolate milkshake.', True, 6),
            ('Kitkat Milkshake', 'Milkshakes', Decimal('75.00'), 'Crunchy KitKat bars blended with chocolate ice cream.', True, 6),
            ('Oreo Milkshake', 'Milkshakes', Decimal('75.00'), 'Thick vanilla shake infused with Oreo cookie crumbs.', True, 6),
            ('Butterscotch Milkshake', 'Milkshakes', Decimal('75.00'), 'Creamy butterscotch crunch and caramel syrup.', True, 6),
            ('Mango Milkshake', 'Milkshakes', Decimal('70.00'), 'Rich Alphonso mango pulp blended in thick cold milk.', True, 6),
            ('Strawberry Milkshake', 'Milkshakes', Decimal('70.00'), 'Sweet pink strawberry shake crowned with strawberry drizzle.', True, 6),
            ('Nutella Milkshake', 'Milkshakes', Decimal('80.00'), 'Hazelnut cocoa Nutella generously blended with ice cream.', True, 6),
            ('Brownie Milkshake', 'Milkshakes', Decimal('75.00'), 'Fudgy chocolate brownie pieces blended into a thick shake.', True, 6),

            # Happiness & Bakery
            ('Brownie With Ice Cream', 'Happiness & Bakery', Decimal('80.00'), 'Warm chocolate walnut brownie served with vanilla ice cream.', True, 5),
            ('Bread Butter (2 Slice)', 'Happiness & Bakery', Decimal('30.00'), 'Soft fresh bread slices smeared with creamy salted Amul butter.', True, 3),
            ('Bread Jam (2 Slice)', 'Happiness & Bakery', Decimal('30.00'), 'Sweet mixed fruit Kissan jam on soft bread slices.', True, 3),
            ('Bake Samosa (plain)', 'Happiness & Bakery', Decimal('25.00'), 'Flaky golden baked pastry stuffed with spiced potatoes.', True, 3),
            ('Bake Samosa With Sauces', 'Happiness & Bakery', Decimal('30.00'), 'Crushed baked samosa drizzled with sweet tamarind and mint chutneys.', True, 3),
        ]

        cafine_count = 0
        for name, cat_name, price, desc, is_veg, prep_time in cafine_items_data:
            cat = cafine_cats.get(cat_name)
            FoodItem.objects.update_or_create(
                canteen=canteen2,
                name=name,
                defaults={
                    'category': cat,
                    'price': price,
                    'description': desc,
                    'is_veg': is_veg,
                    'is_available': True,
                    'preparation_time': prep_time,
                    'stock_quantity': 50,
                }
            )
            cafine_count += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded {cafine_count} Cafine food items and {len(cafine_cats)} categories successfully!'))
        self.stdout.write(self.style.SUCCESS('Initial data seeding completed for CanteenX!'))
