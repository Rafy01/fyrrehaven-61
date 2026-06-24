import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type CSSProperties,
} from "react";
import styles from "./LazyImage.module.css";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

function joinClassNames(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const LazyImage = forwardRef<HTMLImageElement, Props>(function LazyImage(
  {
    className,
    wrapperClassName,
    wrapperStyle,
    loading = "lazy",
    decoding = "async",
    onLoad,
    onError,
    alt,
    ...imgProps
  },
  forwardedRef
) {
  const innerRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = innerRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
      setFailed(false);
    }
  }, [imgProps.src]);

  const setRefs = (node: HTMLImageElement | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  return (
    <span
      className={joinClassNames(styles.wrapper, wrapperClassName)}
      style={wrapperStyle}
      data-loaded={loaded ? "true" : "false"}
      data-failed={failed ? "true" : "false"}
    >
      <span className={styles.skeleton} aria-hidden="true" />
      <img
        {...imgProps}
        ref={setRefs}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={joinClassNames(styles.img, className)}
        onLoad={(event) => {
          setLoaded(true);
          setFailed(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
      />
    </span>
  );
});

export default LazyImage;
