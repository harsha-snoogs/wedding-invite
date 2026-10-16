/**
 * Central Configurable Wedding Information
 * Easily update bride & groom details, dates, venue, family details, and function timelines.
 */
export const weddingData = {
  bride: {
    name: "Snegha",
    fullName: "Snegha Ramachandran",
    photo: "/assets/couple/sneha-solo.jpg",
  },
  groom: {
    name: "Ashwin",
    fullName: "Ashwin Kumar",
    photo: "/assets/couple/ashwin-solo.jpg",
  },
  music: {
    // Your song, looping softly in the background. Put the file in public/assets/audio/.
    // Leave src empty to have no music (the music button then hides itself).
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
      label: "Face to face",
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
    date: "November 26, 2026",
    auspiciousTime: "Muhurtham: 9:15 AM - 10:15 AM",
    venue: "Sri Ramachandra Convention Hall",
    city: "Chennai, Tamil Nadu",
    address:
      "No. 45, Grand Trunk Road, Anna Nagar, Chennai, Tamil Nadu - 600040",
    googleMapsUrl:
      "https://maps.google.com/?q=Sri+Ramachandra+Convention+Hall+Chennai",
    rsvpUrl: "https://forms.gle/wedding-rsvp-placeholder",
    calendarDetails: {
      title: "Snegha & Ashwin Wedding",
      description: "Join us to celebrate the wedding of Snegha and Ashwin!",
      location: "Sri Ramachandra Convention Hall, Chennai",
      startDate: "20261126T090000",
      endDate: "20261126T120000",
    },
  },
  functions: [
    {
      title: "Mehendi Ceremony",
      date: "November 24, 2026",
      time: "4:00 PM onwards",
      venue: "Garden Pavilion, Chennai",
      description:
        "An afternoon of henna, laughter, music, and colorful celebrations.",
    },
    {
      title: "Sangeet & Cocktail Night",
      date: "November 25, 2026",
      time: "7:00 PM onwards",
      venue: "The Grand Ballroom, Chennai",
      description:
        "An evening of dance performances, music, and joyous festivities.",
    },
    {
      title: "Holy Muhurtham",
      date: "November 26, 2026",
      time: "9:00 AM - 11:30 AM",
      venue: "Sri Ramachandra Convention Hall",
      description:
        "The sacred traditional ceremony binding two hearts into one.",
    },
    {
      title: "Grand Reception",
      date: "November 26, 2026",
      time: "6:30 PM onwards",
      venue: "Sri Ramachandra Grand Lawn",
      description:
        "Dinner, toasts, and celebrating our new beginning with loved ones.",
    },
  ],
  families: {
    bride: {
      title: "Snegha's Family",
      subtitle: "Welcoming you with warmth and love",
      members: [
        {
          name: "Smt. Lakshmi & Sri Ramachandran",
          relation: "Parents of the Bride",
        },
        { name: "Ananya Ramachandran", relation: "Sister" },
      ],
    },
    groom: {
      title: "Ashwin's Family",
      subtitle: "Two families becoming one shared journey",
      members: [
        {
          name: "Smt. Radhika & Sri Suresh Kumar",
          relation: "Parents of the Groom",
        },
        { name: "Karthik Kumar", relation: "Brother" },
      ],
    },
  },
};
