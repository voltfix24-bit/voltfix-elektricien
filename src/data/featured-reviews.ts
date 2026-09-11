// Geselecteerde, echte Google-reviews voor de homepage testimonials-sectie.
// Bron: Google Bedrijfsprofiel VoltFix. Alleen reviews met zichtbare tekst
// en toestemming-impliciet publieke weergave zijn opgenomen.

export type FeaturedReview = {
  author: string;
  rating: 5;
  dateNl: string;
  dateEn: string;
  nl: string;
  en: string;
};

export const featuredReviews: FeaturedReview[] = [
  {
    author: "Thomas Schok",
    rating: 5,
    dateNl: "2 weken geleden",
    dateEn: "2 weeks ago",
    nl: "Acuut probleem t.a.v. elektriciteit in huis. Hassan was snel ter plaatse en heeft door secuur uitzoekwerk het probleem kunnen traceren en opgelost. Professioneel, transparant, betrouwbaar, betrokken. Ik kan hem van harte aanbevelen.",
    en: "Sudden electrical problem at home. Hassan arrived quickly and traced and solved the issue through meticulous troubleshooting. Professional, transparent, reliable and involved. I highly recommend him.",
  },
  {
    author: "Berend de Muijnck",
    rating: 5,
    dateNl: "2 weken geleden",
    dateEn: "2 weeks ago",
    nl: "Fijne, vakkundige service. Afspraak maken is erg makkelijk en de elektricien is zeer aardig en behulpzaam!",
    en: "Pleasant, expert service. Booking is very easy and the electrician is very friendly and helpful!",
  },
  {
    author: "paddy nash",
    rating: 5,
    dateNl: "3 weken geleden",
    dateEn: "3 weeks ago",
    nl: "Nassar was erg behulpzaam en loste mijn elektrische probleem op.",
    en: "Nassar was very helpful and sorted out my electrical problem.",
  },
  {
    author: "Wim",
    rating: 5,
    dateNl: "3 weken geleden",
    dateEn: "3 weeks ago",
    nl: "Erg behulpzaam, professioneel en probleem snel opgelost.",
    en: "Very helpful, professional and the problem was solved quickly.",
  },
  {
    author: "Octavio Cabrera",
    rating: 5,
    dateNl: "3 weken geleden",
    dateEn: "3 weeks ago",
    nl: "Hasan heeft uitstekend werk geleverd bij het oplossen van het stroomtekort thuis. Hij ontdekte het probleem snel en bood een oplossing. Ik beveel zijn diensten zeker aan. Dank je.",
    en: "Hasan did outstanding work fixing the issue of power shortage at home. He quickly spotted the problem and provided a solution. I certainly recommend his services. Thank you.",
  },
  {
    author: "Katja Hoorn",
    rating: 5,
    dateNl: "3 weken geleden",
    dateEn: "3 weeks ago",
    nl: "Wat een top ervaring! Super klantvriendelijk, geduldig, netjes, enorm deskundig en aardig. Kan niet anders zeggen dan een aanrader!",
    en: "What a great experience! Super friendly, patient, tidy, highly knowledgeable and kind. Nothing but a recommendation!",
  },
  {
    author: "Sander Van der Hulle",
    rating: 5,
    dateNl: "3 weken geleden",
    dateEn: "3 weeks ago",
    nl: "Nasr heeft geweldig werk geleverd. Buitengewoon aardige en kundige elektricien. Het was een hele moeilijke klus, maar Nasr gaf niet op en heeft het gefixt. Supergoed.",
    en: "Nasr delivered great work. An exceptionally friendly and skilled electrician. It was a very difficult job, but Nasr didn't give up and fixed it. Really good.",
  },
  {
    author: "Otto Saksa",
    rating: 5,
    dateNl: "7 weken geleden",
    dateEn: "7 weeks ago",
    nl: "Nassar hielp me met de upgrade naar een 3-fase aansluiting en het installeren van nieuwe stopcontacten. Hij deed meer dan verwacht om het werkend te krijgen. Zeer flexibel en responsief. Een aanrader!",
    en: "Nassar helped me upgrade to a 3-phase connection and install new electricity sockets. He went above and beyond to make it work. Very flexible and responsive. Highly recommended!",
  },
  {
    author: "Werner Hoelzl",
    rating: 5,
    dateNl: "10 weken geleden",
    dateEn: "10 weeks ago",
    nl: "Enorm behulpzaam, erg vriendelijk en responsief. Loste het eerste probleem in een mum van tijd op. De beste elektricien die ik tot nu toe in Amsterdam ben tegengekomen.",
    en: "Amazingly helpful, very friendly and responsive. Fixed the initial problem in no time. Best electrician I came across in Amsterdam so far.",
  },
  {
    author: "Laura Palmer",
    rating: 5,
    dateNl: "26 jul 2024",
    dateEn: "26 Jul 2024",
    nl: "Zeker aan te raden. Mijn deurbel deed het niet meer en Hassan kwam de volgende dag al met de Ring-deurbel en transformator en installeerde beide. Echt betere service kon ik me niet wensen.",
    en: "Definitely recommend. My doorbell stopped working and Hassan came the very next day with the Ring doorbell and transformer and installed both. Really couldn’t ask for a better service!",
  },
  {
    author: "Andrea Gasparella",
    rating: 5,
    dateNl: "10 jun 2024",
    dateEn: "10 Jun 2024",
    nl: "Geweldige service van Hassan! Hij loste het probleem op en was de hele tijd zeer professioneel, vriendelijk en duidelijk. Aanbevolen.",
    en: "Great service from Hassan! He was able to solve the issue while being very professional, cordial and clear all the time. Recommended.",
  },
  {
    author: "Matt Ragsdale",
    rating: 5,
    dateNl: "7 mrt 2024",
    dateEn: "7 Mar 2024",
    nl: "Hassan zorgde ervoor dat onze elektrische aansluitingen geschikt waren voor een jacuzzi-installatie en vernieuwde onze groepenkast. Vriendelijk, duidelijke uitleg, een echte professional!",
    en: "Hassan ensured our electrical connections were satisfactory for a hot tub installation and updated our electrical panel. Friendly, clear explanations, real pro!",
  },
];
