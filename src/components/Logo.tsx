interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className, size = 24 }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-primary ${className || ''}`}
    >
      {/* MockupStudio-inspired M logo */}
      <path
        d="M5 32V12L12 22L20 8L28 22L35 12V32"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default Logo;
