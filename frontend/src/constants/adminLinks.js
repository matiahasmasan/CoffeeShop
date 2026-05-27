import {
  faHouse,
  faArrowRightArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

export const ADMIN_LINKS = [
  { label: "Home", icon: faHouse, path: "/adminDashboard" },
  {
    label: "Transactions",
    icon: faArrowRightArrowLeft,
    path: "/admin/transactions",
  },
];
