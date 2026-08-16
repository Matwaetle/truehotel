export const HOTELS = [
  {
    id: 'affinia',
    name: 'Affinia Chicago',
    city: 'Chicago',
    description: 'A polished downtown stay near the Magnificent Mile with roomy guest rooms and an easy neighborhood feel. It works well for travelers who want shopping and dining within a short walk.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'allegro',
    name: 'Hotel Allegro Chicago',
    city: 'Chicago',
    description: 'An energetic Loop hotel with theatrical details and a lively lobby. The location is convenient for downtown offices, theaters, and quick train connections.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'amalfi',
    name: 'Amalfi Hotel Chicago',
    city: 'Chicago',
    description: 'A compact River North hotel with a social atmosphere and straightforward city access. Guests are close to restaurants, nightlife, and the riverfront.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'ambassador',
    name: 'Ambassador East Hotel',
    city: 'Chicago',
    description: 'A classic Gold Coast property set on a quieter residential block. Its traditional rooms place guests near the lakefront and neighborhood restaurants.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'conrad',
    name: 'Conrad Chicago',
    city: 'Chicago',
    description: 'An upscale Michigan Avenue hotel focused on spacious rooms and attentive service. Shopping, museums, and downtown landmarks are easy to reach on foot.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'fairmont',
    name: 'Fairmont Chicago',
    city: 'Chicago',
    description: 'A large luxury hotel between the Loop and the lakefront with broad city views. It suits conference trips as well as weekends centered on Millennium Park.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'hardrock',
    name: 'Hard Rock Hotel Chicago',
    city: 'Chicago',
    description: 'A music-themed stay in a landmark tower on Michigan Avenue. The bold interiors and central location appeal to guests who want an active downtown base.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'hilton',
    name: 'Hilton Chicago',
    city: 'Chicago',
    description: 'A historic, high-capacity hotel overlooking Grant Park on South Michigan Avenue. Multiple public spaces and transit access make it practical for large events.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'homewood',
    name: 'Homewood Suites Chicago',
    city: 'Chicago',
    description: 'An extended-stay option in River North with apartment-style rooms and kitchen facilities. It is designed for longer visits without giving up a central location.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'hyatt',
    name: 'Hyatt Regency Chicago',
    city: 'Chicago',
    description: 'A busy riverfront convention hotel with extensive public areas and city views. Guests can walk easily to the Loop, the riverwalk, and Michigan Avenue.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'intercontinental',
    name: 'InterContinental Chicago',
    city: 'Chicago',
    description: 'A landmark luxury hotel directly on the Magnificent Mile with ornate historic spaces. It combines an indoor pool and full-service amenities with a central address.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'james',
    name: 'The James Chicago',
    city: 'Chicago',
    description: 'A design-led River North hotel with contemporary rooms and a residential tone. Dining, galleries, and Michigan Avenue are all nearby.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'knickerbocker',
    name: 'Millennium Knickerbocker',
    city: 'Chicago',
    description: 'A historic Gold Coast hotel with traditional interiors near the lake and shopping district. Its compact footprint offers a quieter alternative to larger convention properties.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'monaco',
    name: 'Hotel Monaco Chicago',
    city: 'Chicago',
    description: 'A colorful boutique hotel near the Chicago River with playful design details. Window seats and a walkable Loop location give it a distinctive city character.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'omni',
    name: 'Omni Chicago Hotel',
    city: 'Chicago',
    description: 'An all-suite hotel on Michigan Avenue offering separate living and sleeping areas. Families and groups benefit from the extra space and central shopping location.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'palmer',
    name: 'Palmer House Hilton',
    city: 'Chicago',
    description: 'A grand historic hotel in the Loop known for its dramatic lobby and large scale. Museums, theaters, and public transit are immediately accessible.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'sheraton',
    name: 'Sheraton Chicago',
    city: 'Chicago',
    description: 'A sizable riverfront hotel with meeting facilities and views across downtown. It is positioned between Navy Pier, the riverwalk, and Michigan Avenue.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'sofitel',
    name: 'Sofitel Chicago Magnificent Mile',
    city: 'Chicago',
    description: 'A modern luxury hotel in the Gold Coast with French-influenced service and sharp architecture. The calmer side-street setting remains close to major shopping.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'swissotel',
    name: 'Swissotel Chicago',
    city: 'Chicago',
    description: 'A triangular glass tower where many rooms overlook the river, lake, or city. Its eastern Loop location is convenient for parks, offices, and family attractions.',
    thumb: '/assets/hotel-placeholder.svg'
  },
  {
    id: 'talbott',
    name: 'The Talbott Hotel',
    city: 'Chicago',
    description: 'A smaller Gold Coast hotel with a club-like atmosphere and personalized service. It sits on a residential street within walking distance of the lake and boutiques.',
    thumb: '/assets/hotel-placeholder.svg'
  }
];

export const HOTEL_BY_ID = new Map(HOTELS.map((hotel) => [hotel.id, hotel]));
