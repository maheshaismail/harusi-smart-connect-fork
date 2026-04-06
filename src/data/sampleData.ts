export interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  verified: boolean;
  image: string;
  description: string;
  descriptionSw: string;
  packages: VendorPackage[];
}

export interface VendorPackage {
  id: string;
  name: string;
  nameSw: string;
  price: number;
  description: string;
  descriptionSw: string;
}

export interface ChatConversation {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'vendor';
  text: string;
  time: string;
}

export const cities = [
  'Dar es Salaam',
  'Arusha',
  'Mwanza',
  'Dodoma',
  'Mbeya',
  'Zanzibar',
];

export const categories = [
  { key: 'mc', en: 'MC', sw: 'MC' },
  { key: 'caterers', en: 'Caterers', sw: 'Wapishi' },
  { key: 'decorators', en: 'Decorators', sw: 'Wapambaji' },
  { key: 'photographers', en: 'Photographers', sw: 'Wapiga Picha' },
  { key: 'weddingPlanners', en: 'Wedding Planners', sw: 'Wapangaji Harusi' },
  { key: 'venues', en: 'Venues', sw: 'Kumbi' },
  { key: 'makeupArtists', en: 'Makeup Artists', sw: 'Warembo' },
  { key: 'transportServices', en: 'Transport Services', sw: 'Huduma za Usafiri' },
];

export const sampleVendors: Vendor[] = [
  {
    id: '1',
    name: 'Mama Ntilie Catering',
    category: 'caterers',
    location: 'Dar es Salaam',
    rating: 4.8,
    reviewCount: 124,
    priceFrom: 500000,
    verified: true,
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop',
    description: 'Premium Tanzanian wedding catering with traditional and modern dishes.',
    descriptionSw: 'Huduma bora za upishi wa harusi za Kitanzania na vyakula vya jadi na vya kisasa.',
    packages: [
      { id: 'p1', name: 'Silver Package', nameSw: 'Kifurushi cha Fedha', price: 500000, description: 'Up to 100 guests, 3 main dishes', descriptionSw: 'Hadi wageni 100, vyakula 3 vikuu' },
      { id: 'p2', name: 'Gold Package', nameSw: 'Kifurushi cha Dhahabu', price: 1200000, description: 'Up to 250 guests, 5 main dishes, dessert', descriptionSw: 'Hadi wageni 250, vyakula 5 vikuu, kitindamlo' },
      { id: 'p3', name: 'Diamond Package', nameSw: 'Kifurushi cha Almasi', price: 2500000, description: 'Up to 500 guests, full buffet, drinks included', descriptionSw: 'Hadi wageni 500, bufee kamili, vinywaji vikijumuishwa' },
    ],
  },
  {
    id: '2',
    name: 'Zanzibar Elegance Decor',
    category: 'decorators',
    location: 'Zanzibar',
    rating: 4.9,
    reviewCount: 89,
    priceFrom: 800000,
    verified: true,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    description: 'Luxury wedding decorations inspired by Zanzibar\'s rich culture.',
    descriptionSw: 'Mapambo ya harusi ya kifahari yaliyochochewa na utamaduni tajiri wa Zanzibar.',
    packages: [
      { id: 'p4', name: 'Classic Setup', nameSw: 'Mpangilio wa Kawaida', price: 800000, description: 'Basic decoration with flowers and draping', descriptionSw: 'Mapambo ya msingi na maua na mapazia' },
      { id: 'p5', name: 'Premium Setup', nameSw: 'Mpangilio wa Kifahari', price: 2000000, description: 'Full venue transformation with lighting', descriptionSw: 'Mabadiliko kamili ya ukumbi na taa' },
    ],
  },
  {
    id: '3',
    name: 'Bongo Beats MC',
    category: 'mc',
    location: 'Dar es Salaam',
    rating: 4.7,
    reviewCount: 156,
    priceFrom: 300000,
    verified: true,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    description: 'Tanzania\'s top wedding MC bringing energy and elegance.',
    descriptionSw: 'MC bora wa harusi Tanzania akileta nguvu na umaridadi.',
    packages: [
      { id: 'p6', name: 'Standard MC', nameSw: 'MC wa Kawaida', price: 300000, description: '4 hours, ceremony + reception', descriptionSw: 'Masaa 4, sherehe + mapokezi' },
      { id: 'p7', name: 'Premium MC + DJ', nameSw: 'MC + DJ wa Kifahari', price: 700000, description: 'Full day, MC + DJ with sound system', descriptionSw: 'Siku nzima, MC + DJ na mfumo wa sauti' },
    ],
  },
  {
    id: '4',
    name: 'Kilimanjaro Studios',
    category: 'photographers',
    location: 'Arusha',
    rating: 4.9,
    reviewCount: 201,
    priceFrom: 400000,
    verified: true,
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop',
    description: 'Award-winning wedding photography with stunning Tanzanian backdrops.',
    descriptionSw: 'Upigaji picha wa harusi wenye tuzo na mandhari nzuri za Tanzania.',
    packages: [
      { id: 'p8', name: 'Photo Only', nameSw: 'Picha Tu', price: 400000, description: '200+ edited photos, pre-wedding shoot', descriptionSw: 'Picha 200+ zilizohaririwa, picha za kabla ya harusi' },
      { id: 'p9', name: 'Photo + Video', nameSw: 'Picha + Video', price: 900000, description: 'Full coverage, drone footage, album', descriptionSw: 'Ufunikaji kamili, picha za drone, albamu' },
    ],
  },
  {
    id: '5',
    name: 'Serengeti Events',
    category: 'weddingPlanners',
    location: 'Arusha',
    rating: 4.6,
    reviewCount: 78,
    priceFrom: 1500000,
    verified: true,
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
    description: 'Full-service wedding planning for unforgettable celebrations.',
    descriptionSw: 'Upangaji harusi kamili kwa sherehe zisizosahaulika.',
    packages: [
      { id: 'p10', name: 'Coordination', nameSw: 'Uratibu', price: 1500000, description: 'Day-of coordination and vendor management', descriptionSw: 'Uratibu wa siku na usimamizi wa watoa huduma' },
      { id: 'p11', name: 'Full Planning', nameSw: 'Mpangilio Kamili', price: 3500000, description: 'Complete wedding planning from start to finish', descriptionSw: 'Mpangilio kamili wa harusi kutoka mwanzo hadi mwisho' },
    ],
  },
  {
    id: '6',
    name: 'Lake Victoria Venue',
    category: 'venues',
    location: 'Mwanza',
    rating: 4.5,
    reviewCount: 45,
    priceFrom: 2000000,
    verified: false,
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop',
    description: 'Beautiful lakeside wedding venue with panoramic views.',
    descriptionSw: 'Ukumbi mzuri wa harusi kando ya ziwa na mandhari ya kupendeza.',
    packages: [
      { id: 'p12', name: 'Venue Only', nameSw: 'Ukumbi Tu', price: 2000000, description: 'Venue rental for up to 300 guests', descriptionSw: 'Kukodisha ukumbi kwa wageni hadi 300' },
      { id: 'p13', name: 'All-Inclusive', nameSw: 'Yote Yakijumuishwa', price: 5000000, description: 'Venue + catering + decoration', descriptionSw: 'Ukumbi + upishi + mapambo' },
    ],
  },
  {
    id: '7',
    name: 'Glam Queens Makeup',
    category: 'makeupArtists',
    location: 'Dar es Salaam',
    rating: 4.8,
    reviewCount: 167,
    priceFrom: 150000,
    verified: true,
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
    description: 'Professional bridal makeup and styling for your special day.',
    descriptionSw: 'Urembo wa kitaalamu wa bibi harusi kwa siku yako maalum.',
    packages: [
      { id: 'p14', name: 'Bridal Only', nameSw: 'Bibi Harusi Tu', price: 150000, description: 'Bridal makeup + hairstyling', descriptionSw: 'Urembo + nywele za bibi harusi' },
      { id: 'p15', name: 'Bridal Party', nameSw: 'Kikundi cha Bibi Harusi', price: 450000, description: 'Bride + 4 bridesmaids', descriptionSw: 'Bibi harusi + wasichana 4' },
    ],
  },
  {
    id: '8',
    name: 'Royal Transport TZ',
    category: 'transportServices',
    location: 'Dodoma',
    rating: 4.4,
    reviewCount: 32,
    priceFrom: 400000,
    verified: true,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0484?w=400&h=300&fit=crop',
    description: 'Luxury wedding car hire with professional chauffeurs.',
    descriptionSw: 'Kukodisha magari ya harusi ya kifahari na madereva wa kitaalamu.',
    packages: [
      { id: 'p16', name: 'Single Car', nameSw: 'Gari Moja', price: 400000, description: 'Mercedes or BMW, full day', descriptionSw: 'Mercedes au BMW, siku nzima' },
      { id: 'p17', name: 'Convoy Package', nameSw: 'Kifurushi cha Msafara', price: 1200000, description: '3 luxury cars + decorated lead car', descriptionSw: 'Magari 3 ya kifahari + gari kuu lililopambwa' },
    ],
  },
];

export const sampleConversations: ChatConversation[] = [
  {
    id: 'c1',
    vendorId: '1',
    vendorName: 'Mama Ntilie Catering',
    vendorImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=80&h=80&fit=crop',
    lastMessage: 'Yes, we can accommodate 200 guests!',
    lastMessageTime: '10:30 AM',
    unread: 2,
    online: true,
  },
  {
    id: 'c2',
    vendorId: '4',
    vendorName: 'Kilimanjaro Studios',
    vendorImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=80&h=80&fit=crop',
    lastMessage: 'I\'ll send the quotation shortly.',
    lastMessageTime: 'Yesterday',
    unread: 0,
    online: false,
  },
  {
    id: 'c3',
    vendorId: '3',
    vendorName: 'Bongo Beats MC',
    vendorImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop',
    lastMessage: 'The date is available. Let\'s finalize!',
    lastMessageTime: 'Yesterday',
    unread: 1,
    online: true,
  },
];

export const sampleMessages: ChatMessage[] = [
  { id: 'm1', conversationId: 'c1', sender: 'user', text: 'Hello! I\'m planning a wedding for 200 guests in Dar es Salaam. Can you help?', time: '10:15 AM' },
  { id: 'm2', conversationId: 'c1', sender: 'vendor', text: 'Karibu sana! Yes, we can accommodate 200 guests!', time: '10:20 AM' },
  { id: 'm3', conversationId: 'c1', sender: 'vendor', text: 'Our Gold Package would be perfect. Would you like a detailed quote?', time: '10:30 AM' },
  { id: 'm4', conversationId: 'c2', sender: 'user', text: 'Hi, do you do pre-wedding shoots in Arusha?', time: '3:00 PM' },
  { id: 'm5', conversationId: 'c2', sender: 'vendor', text: 'Absolutely! We have beautiful locations near Mount Meru. I\'ll send the quotation shortly.', time: '3:45 PM' },
  { id: 'm6', conversationId: 'c3', sender: 'user', text: 'Are you available on March 15th?', time: '11:00 AM' },
  { id: 'm7', conversationId: 'c3', sender: 'vendor', text: 'The date is available. Let\'s finalize!', time: '11:30 AM' },
];

export const formatTZS = (amount: number): string => {
  return `TZS ${amount.toLocaleString('en-US')}`;
};
