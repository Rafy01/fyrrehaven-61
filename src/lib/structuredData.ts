import { reviews } from "../data/reviews";
import { site } from "./siteMeta";

const IMAGE_SET = [
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/ogimage2.jpg",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3724.jpg",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3807.webp",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3736.webp",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3720.webp",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3731.webp",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3692.webp",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3696.webp",
  "https://media.fyrrehaven-61.dk/wp-content/uploads/2025/09/IMG_3709.webp",
];

const SOCIAL_LINKS = [
  "https://www.airbnb.dk/h/fyrrehaven-61",
  "https://www.facebook.com/fyrrehaven61",
  "https://www.instagram.com/fyrrehaven61/",
  "https://www.tiktok.com/@fyrrehaven61",
];

const address = {
  "@type": "PostalAddress",
  streetAddress: "Fyrrehaven 61",
  postalCode: "8585",
  addressLocality: "Glesborg",
  addressRegion: "Region Midtjylland",
  addressCountry: "DK",
};

const aggregateRating = {
  "@type": "AggregateRating",
  ratingValue: Number(
    (
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    ).toFixed(1),
  ),
  reviewCount: reviews.length,
  bestRating: 5,
  worstRating: 1,
};

const reviewSchema = reviews
  .filter((review) => review.textEn.replace(/[.\s]/g, "").length > 0)
  .slice(0, 8)
  .map((review) => ({
    "@type": "Review",
    reviewBody: review.textEn,
    datePublished: review.date,
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: review.author,
    },
  }));

const containsPlace = [
  {
    "@type": "Accommodation",
    name: "Main house",
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: 10,
    },
  },
  {
    "@type": "Accommodation",
    name: "4 bedrooms",
    numberOfRooms: 4,
  },
  {
    "@type": "Accommodation",
    name: "2 bathrooms",
    numberOfBathroomsTotal: 2,
  },
  {
    "@type": "Place",
    name: "Pool and wellness area",
    description: "Heated outdoor pool, electric hot tub, and electric sauna.",
  },
];

function baseAmenity(name: string, description?: string) {
  return {
    "@type": "LocationFeatureSpecification",
    name,
    value: true,
    ...(description ? { description } : {}),
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.baseUrl,
    description: site.description,
    logo: site.publisher.logo,
    image: IMAGE_SET,
    sameAs: SOCIAL_LINKS,
    address,
  };
}

export function buildVacationRentalSchema({
  url,
  description,
  name = site.name,
  amenities = [],
}: {
  url: string;
  description: string;
  name?: string;
  amenities?: Array<{ name: string; description?: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    "@id": `${site.baseUrl}#vacation-rental`,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "fyrrehaven-61",
      value: "fyrrehaven-61",
    },
    additionalType: "https://schema.org/House",
    name,
    description,
    url,
    image: IMAGE_SET,
    address,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 56.510175,
      longitude: 10.585733,
    },
    sameAs: SOCIAL_LINKS,
    aggregateRating,
    review: reviewSchema,
    checkinTime: "16:00",
    checkoutTime: "10:00",
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: 10,
    },
    numberOfBedrooms: 4,
    numberOfBathroomsTotal: 2,
    containsPlace,
    amenityFeature: amenities.map((amenity) =>
      baseAmenity(amenity.name, amenity.description),
    ),
    petsAllowed: false,
  };
}

export function buildLodgingBusinessSchema({
  url,
  description,
}: {
  url: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: site.name,
    url,
    description,
    image: IMAGE_SET,
    address,
    sameAs: SOCIAL_LINKS,
    aggregateRating,
    amenityFeature: [
      baseAmenity("Heated outdoor pool", "Open May 1 to October 1"),
      baseAmenity("Electric hot tub"),
      baseAmenity("Electric sauna"),
      baseAmenity("Forest and beach nearby"),
    ],
    makesOffer: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url,
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: url,
    },
  };
}
