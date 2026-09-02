import type { IconType } from "react-icons";
import {
  IoBanOutline,
  IoBedOutline,
  IoBusinessOutline,
  IoCarSportOutline,
  IoCameraOutline,
  IoChatbubbleEllipses,
  IoChevronDown,
  IoChevronForward,
  IoConstructOutline,
  IoFlashOutline,
  IoFlameOutline,
  IoGameControllerOutline,
  IoGlobeOutline,
  IoHomeOutline,
  IoKeyOutline,
  IoLanguageOutline,
  IoLeafOutline,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTiktok,
  IoLogoYoutube,
  IoMailOutline,
  IoMedalOutline,
  IoMoonOutline,
  IoPeopleOutline,
  IoReceiptOutline,
  IoRestaurantOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoShirtOutline,
  IoSnowOutline,
  IoStar,
  IoStarOutline,
  IoStorefrontOutline,
  IoSunnyOutline,
  IoThermometerOutline,
  IoTimeOutline,
  IoTvOutline,
  IoWalkOutline,
  IoWaterOutline,
  IoWifiOutline,
} from "react-icons/io5";

export type SiteIcon = IconType;

export const UI_ICONS = {
  Camera: IoCameraOutline,
  ChevronDown: IoChevronDown,
  ChevronForward: IoChevronForward,
  DarkMode: IoMoonOutline,
  LightMode: IoSunnyOutline,
  Mail: IoMailOutline,
  Globe: IoGlobeOutline,
  Settings: IoSettingsOutline,
  Messenger: IoChatbubbleEllipses,
  Rating: IoStar,
  EmptyRating: IoStarOutline,
} satisfies Record<string, SiteIcon>;

export const SOCIAL_ICONS = {
  Instagram: IoLogoInstagram,
  Facebook: IoLogoFacebook,
  TikTok: IoLogoTiktok,
  YouTube: IoLogoYoutube,
} satisfies Record<string, SiteIcon>;

export const HOME_USP_ICONS = {
  Response: IoFlashOutline,
  CheckIn: IoKeyOutline,
  Rating: IoStar,
  Experience: IoMedalOutline,
} satisfies Record<string, SiteIcon>;

export const PRACTICAL_INFO_ICONS = {
  Key: IoKeyOutline,
  Clock: IoTimeOutline,
  Wifi: IoWifiOutline,
  Car: IoCarSportOutline,
  Bed: IoBedOutline,
  NoParty: IoBanOutline,
  Roll: IoReceiptOutline,
  Heat: IoThermometerOutline,
  Washer: IoWaterOutline,
  Tv: IoTvOutline,
  Gamepad: IoGameControllerOutline,
  Ac: IoSnowOutline,
  Ev: IoFlashOutline,
  Baby: IoPeopleOutline,
  Iron: IoShirtOutline,
  Grill: IoFlameOutline,
} satisfies Record<string, SiteIcon>;

export const DISTANCE_ICONS = {
  Beach: IoSunnyOutline,
  Forest: IoLeafOutline,
  Walk: IoWalkOutline,
  Shop: IoStorefrontOutline,
  City: IoBusinessOutline,
  Car: IoCarSportOutline,
} satisfies Record<string, SiteIcon>;

export const TAG_ICONS = {
  All: IoStarOutline,
  Beach: IoSunnyOutline,
  Leaf: IoLeafOutline,
  Parks: IoFlashOutline,
  Indoor: IoHomeOutline,
  Food: IoRestaurantOutline,
  Culture: IoBusinessOutline,
  Kids: IoPeopleOutline,
} satisfies Record<string, SiteIcon>;

export const HOST_ICONS = {
  Star: IoStar,
  Bolt: IoFlashOutline,
  Badge: IoShieldCheckmarkOutline,
  Globe: IoLanguageOutline,
} satisfies Record<string, SiteIcon>;

export const FOOTER_ACCORDION_ICONS = {
  Explore: IoGlobeOutline,
  Contact: IoMailOutline,
  Practical: IoConstructOutline,
} satisfies Record<string, SiteIcon>;
