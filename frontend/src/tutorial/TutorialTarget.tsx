import React, { ReactNode } from 'react';

type TutorialTargetProps = {
  id: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
};

export function TutorialTarget({ id, children, className, style, as: Component = 'div' }: TutorialTargetProps) {
  // Este wrapper é puramente estrutural e estático. Não adiciona animações Framer Motion, garantindo que
  // o tutorial consegue calcular o bounding rect com precisão antes das animações interiores terminarem.
  return (
    <Component id={id} className={className} style={style}>
      {children}
    </Component>
  );
}
