import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  wrapperClassName?: string;
}

/**
 * Image with an always-on loading skeleton until the image finishes loading.
 */
const ImageWithLoader = ({ src, className, wrapperClassName, alt = "", onLoad, onError, ...rest }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={cn("relative w-full h-full", wrapperClassName)}>
      {(!loaded || errored) && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {src && (
        <img
          {...rest}
          src={src}
          alt={alt}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            setErrored(true);
            onError?.(e);
          }}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded && !errored ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
};

export default ImageWithLoader;