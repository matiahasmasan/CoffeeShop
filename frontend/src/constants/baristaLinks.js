import {
  faHouse,
  faQrcode,
  faArrowRightArrowLeft,
  faGear,
} from "@fortawesome/free-solid-svg-icons";

export const BARISTA_LINKS = [
  { label: "Home", icon: faHouse, path: "/barista-dashboard" },
  {
    label: "Transactions",
    icon: faArrowRightArrowLeft,
    path: "/barista/transactions",
  },
  { label: "Settings", icon: faGear, path: "/barista/settings" },
];
