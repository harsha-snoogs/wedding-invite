/**
 * Central Configurable Wedding Information
 * Easily update bride & groom details, dates, venue, family details, and function timelines.
 */
export const weddingData = {
  bride: {
    name: "Snegha",
    fullName: "Snegha",
    photo: "/assets/couple/sneha-solo.jpg",
  },
  groom: {
    name: "Ashwin",
    fullName: "Ashwin",
    photo: "/assets/couple/ashwin-solo.jpg",
  },
  music: {
    // Your song, looping softly in the background. Put the file in public/assets/audio/.
    // Leave src empty to have no music (the music button then hides itself).
    // src: "/assets/audio/seele.MP3",
    src: "/assets/audio/love_bug_has_bitten_cut.MP3",
    // Optional: 0-1 to play it quieter (iPhones ignore this and play at full level).
    // volume: 0.8,
  },
  couple: {
    monogram: "S & A",
    closingHeadline: "Every journey has a beginning.",
    closingSubhead: "Ours brought us here.",
    invitationMessage:
      "Please join us, celebrate with us, and bless us as we begin our forever.",
  },
  // Short notes that appear as each moment of the film settles - rewrite them in your own
  // words. `frame` is the photo they belong to (see src/Storyboard.js). The opening shot
  // carries the title; the last scene shows its note first, then your names.
  journey: [
    {
      frame: "02-hands",
      label: "The first promise",
      text: "A hand, held a little longer than it needed to be.",
    },
    {
      frame: "03-face-other",
      label: "In Your Eyes 🤍",
      text: "Then came the glances that said what words couldn't.",
    },
    // Used only if the walking photo (backup) goes back into the film.
    {
      frame: "03-journey-start",
      label: "Side by side",
      text: "Then came the long walks, and the quiet ones too.",
    },
  ],
  // Shown above your names in the last scene, as the camera pulls back.
  finaleLine: "Two paths, one journey",
  wedding: {
    date: "November 15 & 16 - 2026",
    auspiciousTime: "Muhurtham: 06:35 AM - 07:15 AM",
    venue: "Sri Vasavi Mithra Mahal",
    city: "Coimbatore",
    address: "Royal Iswaryam hall, Perur road, Telungupalayam",
    googleMapsUrl: "https://maps.app.goo.gl/sh1sDH243gJYEbyB8",
    calendarDetails: {
      title: "Snegha & Ashwin Wedding",
      description: "Join us to celebrate the wedding of Snegha and Ashwin!",
      location: "Sri Vasavi Mithra Mahal, Coimbatore",
      startDate: "20261115T000000",
      endDate: "20261116T235959",
    },
  },
  functions: [
    {
      type: "welcome",
      title: "Welcome",
      date: "November 15, 2026",
      time: "08:30 AM onwards",
      bg: "/assets/occasions/welcome-bg.jpg",
      description:
        "A heartfelt welcome to the groom’s family as both families come together to celebrate love, joy, and new beginnings.",
    },
    {
      type: "engagement",
      title: "Nitchayathartham",
      date: "November 15, 2026",
      time: "11:00 AM onwards",
      bg: "/assets/occasions/engagement-bg.jpg",
      description:
        "A beautiful promise of togetherness, as two families unite to bless a new beginning.",
    },
    {
      type: "reception",
      title: "Reception",
      date: "November 15, 2026",
      time: "06:30 PM onwards",
      bg: "/assets/occasions/reception-bg.jpg",
      description:
        "An evening of elegance and celebration, sharing our happiness with the people we love.",
    },
    {
      type: "upanayanam",
      title: "Upanayanam",
      date: "November 16, 2026",
      time: "04:00 AM - 05:00 AM",
      bg: "/assets/occasions/upanayanam-bg.jpg",
      description:
        "A sacred rite of passage, marking the beginning of a spiritual journey filled with wisdom and blessings.",
    },
    {
      type: "muhurtham",
      title: "Subha Muhurtham",
      date: "November 16, 2026",
      time: "06:35 AM to 07:15 AM",
      bg: "/assets/occasions/muhurtham-bg.jpg",
      description:
        "A sacred union blessed with love, happiness, and a lifetime of beautiful tomorrows.",
    },
  ],
  coimbatorePostcards: [
    {
      id: "perur",
      title: "Perur Pateeswarar Temple",
      tagline: "1,500-Year-Old Chola Architectural Marvel",
      category: "Ancient Temple & Heritage",
      image: "/assets/coimbatore/perur.jpg",
      distance: "3.5 km · 8 mins from Venue",
      location: "Perur, Coimbatore (Right on Perur Road)",
      bestTime:
        "Early Morning or Sunset (07:00 AM - 11:30 AM / 05:00 PM - 08:00 PM)",
      description:
        "Located right on Perur Road just minutes from our wedding hall, this sacred 1,500-year-old temple built by Karikala Chola is renowned for its breathtaking Kanaka Sabha (Golden Hall). Intricate monolithic stone pillars depict Shiva's Ananda Tandava and celestial deities with unimaginable detail.",
      highlights: [
        "Kanaka Sabha Carved Pillars",
        "Sacred Noyyal River Ghat",
        "Centuries of Chola Legacy",
      ],
      mapsUrl: "https://maps.app.goo.gl/9Z3h7B5b6M1k8pYV6",
    },
    {
      id: "adiyogi",
      title: "Adiyogi Shiva & Isha Yoga",
      tagline: "World's Largest Bust Sculpture",
      category: "Iconic & Spiritual Landmark",
      image: "/assets/coimbatore/adiyogi.jpg",
      distance: "28 km · 45 mins from Venue",
      location: "Isha Yoga Center, Velliangiri Foothills",
      bestTime: "Late Afternoon & Evening (05:00 PM - 08:00 PM)",
      description:
        "Recognized by Guinness World Records, the awe-inspiring 112-foot bust of Adiyogi Shiva stands majestically framed by the mist-shrouded peaks of the Velliangiri mountain range. Don't miss the spellbinding Divya Darshanam 3D laser projection show every evening at 7:00 PM.",
      highlights: [
        "112-ft Adiyogi Statue",
        "Dhyanalinga & Theerthakund",
        "Evening 3D Light & Sound Show",
      ],
      mapsUrl: "https://maps.app.goo.gl/95yG1Qy1eUqUjZ6A9",
    },
    {
      id: "marudhamalai",
      title: "Marudhamalai Murugan Temple",
      tagline: "Scenic Hilltop Sanctuary in the Western Ghats",
      category: "Hilltop Temple",
      image: "/assets/coimbatore/marudhamalai.jpg",
      distance: "14 km · 25 mins from Venue",
      location: "Marudhamalai, Coimbatore",
      bestTime: "Early Morning (06:30 AM - 10:00 AM)",
      description:
        "Perched gracefully atop a granite crest of the Western Ghats, this 12th-century shrine dedicated to Lord Murugan is celebrated for its lush herbal hills and panoramic views over Coimbatore city. A tranquil sanctuary where cool mountain air meets sacred serenity.",
      highlights: [
        "Pambatti Siddhar Cave",
        "Panoramic 360° Valley Views",
        "Scenic Ghat Road",
      ],
      mapsUrl: "https://maps.app.goo.gl/VqD2h6P4y6nJc7jU7",
    },
    {
      id: "valparai",
      title: "Valparai & Anamalai Tea Hills",
      tagline: "Rolling Emerald Tea Gardens & Misty Clouds",
      category: "Hill Station & Nature",
      image: "/assets/coimbatore/valparai.jpg",
      distance: "65 km from Venue (via Pollachi)",
      location: "Anamalai Hills, Western Ghats",
      bestTime: "Day Trip / Early Morning Drive",
      description:
        "Nestled 3,500 feet high in the Anamalai range, Valparai is a peaceful, untouched hill paradise. The scenic drive features 40 hairpin bends, cascading waterfalls, velvet-green tea estates, and opportunities to spot the endangered Nilgiri Tahr.",
      highlights: [
        "40 Hairpin Mountain Drive",
        "Lush Tea Plantation Walks",
        "Sholayar Reservoir",
      ],
      mapsUrl: "https://maps.app.goo.gl/3j2c7K1x7mQ8v9ZA8",
    },
    {
      id: "siruvani",
      title: "Siruvani Waterfalls & Rainforest",
      tagline: "World's Sweetest Natural Water",
      category: "Nature & Cascades",
      image: "/assets/coimbatore/siruvani.jpg",
      distance: "35 km · 55 mins from Venue",
      location: "Siruvani Hills, Western Ghats",
      bestTime: "10:00 AM - 03:00 PM",
      description:
        "Hidden deep inside the dense rainforest reserves of the Western Ghats, the Siruvani river is world-renowned for its exceptionally mineral-rich, sweet drinking water. The multi-tiered cascades tumbling into crystal pools are an unforgettable sight.",
      highlights: [
        "World's Sweetest Water",
        "Forest Safari Drive",
        "Pristine Rainforest Scenery",
      ],
      mapsUrl: "https://maps.app.goo.gl/dM1p9Z7t8B4e6kXQ8",
    },
    {
      id: "aliyar",
      title: "Aliyar Dam & Foothills Reservoir",
      tagline: "Tranquil Waters at the Base of the Mountains",
      category: "Scenic Lake & Gardens",
      image: "/assets/coimbatore/aliyar.jpg",
      distance: "42 km · 50 mins from Venue",
      location: "Foothills of Valparai, Pollachi",
      bestTime: "Afternoon to Sunset (04:00 PM - 06:30 PM)",
      description:
        "Sitting peacefully at the base of the towering Anamalai hills, Aliyar Dam is famous for its vast, mirror-like lake reflecting cloud-kissed peaks, well-maintained botanical gardens, and gentle boating.",
      highlights: [
        "Mountain Reservoir Lake",
        "Manicured Gardens & Play Area",
        "Breathtaking Sunset Vistas",
      ],
      mapsUrl: "https://maps.app.goo.gl/XqL3Z5xT7v2b1a8j6",
    },
  ],
  families: {
    bride: {
      title: "Snegha's Family",
      subtitle: "Welcoming you with warmth and love",
      photo: "/assets/family/bride-family.jpg",
      members: [
        {
          name: "Smt. M.Yogalakshmi & Sri. V.Muralidharan",
        },
      ],
    },
    groom: {
      title: "Ashwin's Family",
      subtitle: "Two families becoming one shared journey",
      photo: "/assets/family/groom-family.jpg",
      members: [
        {
          name: "Smt. S.Kalpana & Sri. D.Sampathkumar",
        },
      ],
    },
  },
};
