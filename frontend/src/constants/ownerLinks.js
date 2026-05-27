import {
  faHouse,
  faArrowRightArrowLeft,
  faPen,
  faGear,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export const OWNER_LINKS = [
  { label: "Home", icon: faHouse, path: "/owner" },
  { label: "Baristas", icon: faUsers, path: "/owner/baristas" },
  {
    label: "Transactions",
    icon: faArrowRightArrowLeft,
    path: "/owner/transactions",
  },
  { label: "Menu", icon: faPen, path: "/owner/menu" },
  { label: "Settings", icon: faGear, path: "/owner/settings" },
];
