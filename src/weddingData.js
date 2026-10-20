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
      title: "Welcome",
      date: "November 15, 2026",
      time: "08:30 AM",
      description:
        "A heartfelt welcome to the groom’s family as both families come together to celebrate love, joy, and new beginnings.",
    },
    {
      title: "Nitchayathartham",
      date: "November 15, 2026",
      time: "11:00 AM",
      description:
        "A beautiful promise of togetherness, as two families unite to bless a new beginning.",
    },
    {
      title: "Reception",
      date: "November 15, 2026",
      time: "06:30 PM",
      description:
        "An evening of elegance and celebration, sharing our happiness with the people we love.",
    },
    {
      title: "Upanayanam",
      date: "November 16, 2026",
      time: "04:00 AM - 05:00 AM",
      description:
        "A sacred rite of passage, marking the beginning of a spiritual journey filled with wisdom and blessings.",
    },
    {
      title: "Subha Muhurtham",
      date: "November 16, 2026",
      time: "06:35 AM to 07:15 AM",
      description:
        "A sacred union blessed with love, happiness, and a lifetime of beautiful tomorrows.",
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
