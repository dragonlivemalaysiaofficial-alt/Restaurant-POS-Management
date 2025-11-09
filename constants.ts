
import { MenuItem, Category, RestaurantSettings } from './types';

export const INITIAL_SETTINGS: RestaurantSettings = {
  restaurantName: 'Restaurant POS',
  address: '123 Food Street, Flavor Town',
  phone: '(555) 123-4567',
  currencySymbol: 'Rs.',
  taxRate: 5,
  numberOfTables: 12,
  footerMessage: 'Thank you for your visit!',
  commonNotes: ['Extra Spicy', 'No Onions', 'Less Sugar', 'Well Done'],
  kotBotCategoryAssignments: {
    kitchen: ['Breakfast', 'Snacks'],
    bar: ['Beverages'],
  },
  managerPermissions: {
    canManageMenu: true,
    canManageUsers: true,
    canViewReports: true,
    canManageCustomers: true,
    canAccessAdminPanel: true,
  }
};

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Idly', price: 10, category: 'Breakfast', description: 'Soft, steamed rice cakes, a classic South Indian breakfast.', imageUrl: 'https://images.unsplash.com/photo-1668635398284-f335555b2def?q=80&w=200', stockTracking: false, stock: 0, commonNotes: [] },
  { id: '2', name: 'Puttu', price: 25, category: 'Breakfast', description: 'Steamed cylinders of ground rice layered with coconut shavings.', imageUrl: 'https://images.unsplash.com/photo-1606491103217-27108855013c?q=80&w=200', stockTracking: false, stock: 0, commonNotes: [] },
  { id: '3', name: 'Poori', price: 30, category: 'Breakfast', description: 'A deep-fried bread made from unleavened whole-wheat flour.', imageUrl: 'https://images.unsplash.com/photo-1626513425028-508a6c8e3b7b?q=80&w=200', stockTracking: false, stock: 0, commonNotes: ['Extra Spicy'] },
  { id: '4', name: 'Coffee', price: 15, category: 'Beverages', description: 'Freshly brewed filter coffee, strong and aromatic.', imageUrl: 'https://images.unsplash.com/photo-1511920183303-6239241644a4?q=80&w=200', stockTracking: true, stock: 50, commonNotes: ['Less Sugar'] },
  { id: '5', name: 'Dosai', price: 35, category: 'Breakfast', description: 'A thin, crispy pancake made from a fermented batter of rice and lentils.', imageUrl: 'https://images.unsplash.com/photo-1668236543033-70d51f31501a?q=80&w=200', stockTracking: false, stock: 0, commonNotes: ['Extra Spicy', 'No Onions'] },
  { id: '6', name: 'Vada', price: 12, category: 'Snacks', description: 'A savoury fried snack, doughnut-shaped and crispy.', imageUrl: 'https://images.unsplash.com/photo-1643922338337-9d7a2c07c6f2?q=80&w=200', stockTracking: true, stock: 100, commonNotes: ['No Onions'] },
  { id: '7', name: 'Pazham Pori', price: 15, category: 'Snacks', description: 'Ripe plantain slices coated in a sweet flour batter and deep-fried.', imageUrl: 'https://images.unsplash.com/photo-1602593429302-34861d859a88?q=80&w=200', stockTracking: false, stock: 0, commonNotes: [] },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Breakfast' },
  { id: 'cat-2', name: 'Beverages' },
  { id: 'cat-3', name: 'Snacks' },
];

export const CATEGORIZED_STOCK_IMAGES: { [key: string]: string[] } = {
  'Breakfast & Snacks': [
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=200', // Pancakes
    'https://images.unsplash.com/photo-1484723051597-62b14d8583de?q=80&w=200', // French Toast
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=200', // Avocado Toast
    'https://images.unsplash.com/photo-1586511925558-a4c6376fe658?q=80&w=200', // Sandwich
    'https://images.unsplash.com/photo-1600320254356-6ae76b6e448b?q=80&w=200', // Fries
  ],
  'Main Courses': [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200', // Pizza
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200', // Salad Bowl
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=200', // Grilled Chicken
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=200', // Salad with salmon
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200', // Healthy bowl
    'https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=200', // Pasta
    'https://images.unsplash.com/photo-1588281849389-952a4cb28b4e?q=80&w=200', // Dumplings
    'https://images.unsplash.com/photo-1526318896980-cf78c0882475?q=80&w=200', // Ramen
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=200', // Burger
    'https://images.unsplash.com/photo-1461009683693-342af2f2d6ce?q=80&w=200', // Soup
    'https://images.unsplash.com/photo-1625944022834-3a57135ab545?q=80&w=200', // Tacos
  ],
  'Beverages': [
     'https://images.unsplash.com/photo-1511920183303-6239241644a4?q=80&w=200', // Coffee
     'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=200', // Tea
     'https://images.unsplash.com/photo-1575789313492-82c5def826a7?q=80&w=200', // Juice
     'https://images.unsplash.com/photo-1551024709-8f23befc6f81?q=80&w=200', // Cocktail
  ]
};
