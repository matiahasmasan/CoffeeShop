import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faFacebook,
  faTwitter,
  faTiktok,
  faYoutube,
  faLinkedin,
  faPinterest,
  faSnapchat,
} from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

const PLATFORM_CONFIG = {
  instagram: {
    icon: faInstagram,
    label: "Instagram",
    color: "hover:text-pink-500",
  },
  facebook: {
    icon: faFacebook,
    label: "Facebook",
    color: "hover:text-blue-600",
  },
  twitter: {
    icon: faTwitter,
    label: "Twitter",
    color: "hover:text-sky-400",
  },
  tiktok: {
    icon: faTiktok,
    label: "TikTok",
    color: "hover:text-black",
  },
  youtube: {
    icon: faYoutube,
    label: "YouTube",
    color: "hover:text-red-500",
  },
  linkedin: {
    icon: faLinkedin,
    label: "LinkedIn",
    color: "hover:text-blue-700",
  },
  pinterest: {
    icon: faPinterest,
    label: "Pinterest",
    color: "hover:text-red-600",
  },
  snapchat: {
    icon: faSnapchat,
    label: "Snapchat",
    color: "hover:text-yellow-400",
  },
  website: {
    icon: faGlobe,
    label: "Website",
    color: "hover:text-indigo-500",
  },
};

export default function SocialLinks({ links }) {
  if (!links || Object.keys(links).length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {Object.entries(links).map(([platform, url]) => {
        const config =
          PLATFORM_CONFIG[platform.toLowerCase()] ?? PLATFORM_CONFIG.website;

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={config.label}
            title={config.label}
            className={`text-gray-400 ${config.color} transition-colors duration-200`}
          >
            <FontAwesomeIcon icon={config.icon} size="xl" />
          </a>
        );
      })}
    </div>
  );
}
