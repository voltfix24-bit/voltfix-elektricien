import { describe, expect, it } from "vitest";
import { business } from "./business";
import { aggregateRating } from "@/data/reviews";

describe("confirmed VoltFix business profile", () => {
  it("is open all seven days for the whole day", () => {
    expect(business.openingHours).toEqual([{
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00", closes: "23:59",
    }]);
  });
  it("uses the active business listing rather than the street pin", () => {
    expect(business.googlePlaceId).toBe("ChIJwXV-DD_jxUcRTe3MYP9asN0");
    expect(business.hasMap).toContain(`place_id:${business.googlePlaceId}`);
  });
  it("has the corrected street address and postcode", () => {
    expect(business.streetAddress).toBe("Jacob van Lennepkade 142");
    expect(business.postalCode).toBe("1053 MV");
  });
  it("matches the freshly read Google rating and review count", () => {
    expect(aggregateRating.ratingValue).toBe(5);
    expect(aggregateRating.reviewCount).toBe(81);
  });
  it("points every review score at the verified active listing", () => {
    expect(business.googleReviewsUrl).toBe(
      "https://maps.google.com/maps?cid=15974367931170352461",
    );
    expect(business.googleReviewsUrl).toBe(business.googleMapsPlace);
  });
});