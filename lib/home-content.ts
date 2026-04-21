import type { ActivityGroup, LaunchStep } from "@/types/home";

export const launchSteps: LaunchStep[] = [
  {
    title: "Create or join a small activity group",
    description:
      "Hosts can start a group with a title, activity type, area, and small member limit, while others can browse and join open spots.",
  },
  {
    title: "Propose meetup times",
    description:
      "Inside each group, meetup slots can be added so everyone has a few clear time options to choose from.",
  },
  {
    title: "Vote when you are available",
    description:
      "Members can mark themselves available for the slots that work best and quickly see the most popular timing.",
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
