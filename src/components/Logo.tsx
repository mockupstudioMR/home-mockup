import logoImage from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className, size = 32 }: LogoProps) => {
  return (
    <img
      src={logoImage}
      alt="HomeMockUp"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;