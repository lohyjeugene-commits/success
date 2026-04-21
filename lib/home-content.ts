import type { ActivityGroup, LaunchStep } from "@/types/home";

export const launchSteps: LaunchStep[] = [
  {
    title: "Create a meetup",
    description:
      "A host picks the activity, neighbourhood, date, and a small maximum group size.",
  },
  {
    title: "Let people join",
    description:
      "Users browse what is happening nearby and claim one of the limited spots.",
  },
  {
    title: "Chat before meeting",
    description:
      "A simple group chat keeps logistics in one place before everyone meets offline.",
  },
];

export const activityGroups: ActivityGroup[] = [
  {
    title: "Basketball",
    description:
      "Quick after-school or after-work runs for people who want a short, social game.",
    locationHint: "Neighbourhood courts and community spaces",
    groupSize: "4-6 people",
  },
  {
    title: "Study Sessions",
    description:
      "Focused accountability meetups for students, exam prep, or side-project work blocks.",
    locationHint: "Cafe corners and campus study spots",
    groupSize: "4-6 people",
  },
  {
    title: "Gym Buddies",
    description:
      "Low-pressure gym meetups for shared motivation, spotting, and keeping a routine going.",
    locationHint: "Commercial gyms and condo gyms",
    groupSize: "4-6 people",
  },
  {
    title: "Cycling",
    description:
      "Short beginner-friendly rides or casual weekend loops without the chaos of large groups.",
    locationHint: "Park connectors and scenic routes",
    groupSize: "4-6 people",
  },
  {
    title: "Dance",
    description:
      "Practice sessions for choreography, freestyle, or simply meeting new people through movement.",
    locationHint: "Studios, void decks, and open spaces",
    groupSize: "4-6 people",
  },
  {
    title: "Library Meetups",
    description:
      "Quiet co-study or reading sessions for people who want company without a noisy setting.",
    locationHint: "Public libraries and reading rooms",
    groupSize: "4-6 people",
  },
];
