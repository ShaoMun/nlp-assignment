import styled from 'styled-components';
import ParticleBackground from './ParticleBackground';

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParticleBackground />
      <Content>{children}</Content>
    </>
  );
} 