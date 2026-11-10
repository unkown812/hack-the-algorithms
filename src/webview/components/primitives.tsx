import type { FunctionComponent } from 'react';
import { COLORS, RADIUS } from './Theme';

type BoxProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
  title?: string;
  role?: string;
};

export const Box: FunctionComponent<BoxProps> = ({ children, className, style, ...rest }) => {
  const mergedStyle: React.CSSProperties = {
    display: 'block',
    ...style,
  };
  return (
    <div className={className} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
};

type FlexProps = BoxProps & {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  justify?:
    | 'start'
    | 'end'
    | 'center'
    | 'between'
    | 'around'
    | 'evenly'
    | 'flex-start'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  gap?: string;
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
};

export const Flex: FunctionComponent<FlexProps> = ({
  children,
  className,
  style,
  direction = 'row',
  align = 'center',
  justify = 'flex-start',
  gap,
  wrap,
  ...rest
}) => {
  const justifyMap: Record<string, string> = {
    start: 'flex-start',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  };

  const mergedStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justifyMap[justify] ?? justify,
    ...(gap ? { gap } : {}),
    ...(wrap ? { flexWrap: wrap } : {}),
    ...style,
  };
  return (
    <div className={className} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
};

type TextProps = BoxProps & {
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
};

export const Text: FunctionComponent<TextProps> = ({ children, className, style, as = 'div', ...rest }) => {
  const Tag = as as React.ElementType;
  const mergedStyle: React.CSSProperties = { ...style };
  return (
    <Tag className={className} style={mergedStyle} {...rest}>
      {children}
    </Tag>
  );
};

type ButtonProps = BoxProps & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
};

export const Button: FunctionComponent<ButtonProps> = ({
  children,
  className,
  style,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  ...rest
}) => {
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: COLORS.accent,
      color: '#ffffff',
      border: 'none',
    },
    secondary: {
      backgroundColor: COLORS.surfaceElevated,
      color: COLORS.textPrimary,
      border: `1px solid ${COLORS.border}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: COLORS.textSecondary,
      border: 'none',
    },
    danger: {
      backgroundColor: COLORS.error,
      color: '#ffffff',
      border: 'none',
    },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '0.5rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.9375rem' },
    lg: { padding: '0.875rem 1.5rem', fontSize: '1rem' },
  };

  const mergedStyle: React.CSSProperties = {
    ...variants[variant],
    ...sizes[size],
    borderRadius: RADIUS.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  return (
    <button
      className={className}
      style={mergedStyle}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};
