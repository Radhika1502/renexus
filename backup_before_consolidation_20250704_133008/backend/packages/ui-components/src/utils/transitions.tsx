import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";

/**
 * Transition states for animation components
 */
export type TransitionState = "entering" | "entered" | "exiting" | "exited";

/**
 * Base props for the Transition component
 */
interface TransitionBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the component is showing */
  show: boolean;
  /** Duration of the transition in ms */
  duration?: number;
  /** Callback when the enter transition starts */
  onEnter?: () => void;
  /** Callback when the enter transition completes */
  onEntered?: () => void;
  /** Callback when the exit transition starts */
  onExit?: () => void;
  /** Callback when the exit transition completes */
  onExited?: () => void;
  /** Additional class names for the transition element */
  className?: string;
}

/**
 * Props for the Transition component
 */
export interface TransitionProps extends TransitionBaseProps {
  /** Children to render */
  children: React.ReactNode;
}

/**
 * Transition component for handling animation states
 * 
 * @example
 * <Transition show={isOpen} duration={300}>
 *   <div>Content that transitions in/out</div>
 * </Transition>
 */
export const Transition: React.FC<TransitionProps> = ({
  show,
  duration = 300,
  onEnter,
  onEntered,
  onExit,
  onExited,
  className,
  children,
  ...props
}) => {
  const [state, setState] = React.useState<keyof typeof transitionVariants.variants.state>(
    show ? "enterActive" : "exit"
  );

  const transitionVariants = cva("transition-all duration-300", {
    variants: {
      state: {
        enter: "opacity-0",
        enterActive: "opacity-100",
        exit: "opacity-100",
        exitActive: "opacity-0"
      }
    },
    defaultVariants: {
      state: "enter"
    }
  });

  React.useEffect(() => {
    if (show) {
      onEnter?.();
      setState("enter");
      const enterTimeout = setTimeout(() => {
        setState("enterActive");
        onEntered?.();
      }, 10);

      return () => clearTimeout(enterTimeout);
    } else {
      onExit?.();
      setState("exit");
      const exitTimeout = setTimeout(() => {
        setState("exitActive");
        onExited?.();
      }, duration);

      return () => clearTimeout(exitTimeout);
    }
  }, [show, duration, onEnter, onEntered, onExit, onExited]);

  return (
    <div
      className={transitionVariants({ state, className })}
      style={{ transitionDuration: `${duration}ms` }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Props for the Fade component
 */
export interface FadeProps extends TransitionBaseProps {
  /** Children to render */
  children?: React.ReactNode;
}

/**
 * Fade transition component for simple fade animations
 * 
 * @example
 * <Fade show={isVisible}>
 *   <div>Content that fades in/out</div>
 * </Fade>
 */
export const Fade: React.FC<FadeProps> = ({ children, ...props }) => (
  <Transition {...props}>
    {children}
  </Transition>
);

/**
 * Props for the Slide component
 */
interface SlideProps extends FadeProps {
  /** Direction of the slide transition */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Distance of the slide transition */
  distance?: number | string;
}

/**
 * Slide transition component for sliding animations
 * 
 * @example
 * <Slide show={isVisible} direction="up">
 *   <div>Content that slides in/out</div>
 * </Slide>
 */
export const Slide: React.FC<SlideProps> = ({
  direction = 'up',
  distance = '1rem',
  ...props
}) => {
  const getTransform = () => {
    switch (direction) {
      case 'up': return `translateY(${distance})`;
      case 'down': return `translateY(-${distance})`;
      case 'left': return `translateX(${distance})`;
      case 'right': return `translateX(-${distance})`;
      default: return `translateY(${distance})`;
    }
  };

  return (
    <Transition
      {...props}
      className={clsx(
        props.className,
        {
          'opacity-0': props.show === false,
          [getTransform()]: props.show === false
        }
      )}
      style={{
        transitionProperty: 'opacity, transform',
        ...props.style
      }}
    >
      {props.children}
    </Transition>
  );
};
