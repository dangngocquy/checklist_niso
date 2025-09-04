import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Typography } from 'antd';

const { Text } = Typography;

const SlideContainer = styled(motion.div)`
  display: flex;
  position: relative;
  transition: all 0.3s ease;
  justify-content: center;
  align-items: center;
  min-height: calc(-200px + 100vh);
  gap: 2rem;
  flex-direction: column; /* Always column layout */

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    gap: 1.5rem;
    min-height: auto;
  }
`;

const TitleContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  text-align: center;
  background: #fff; /* Added background */
  padding: 1.5rem 2rem; /* Adjusted padding */
  border-radius: 12px; /* Added border-radius */
  backdrop-filter: blur(8px); /* Added backdrop-filter */
  border: 1px solid rgba(255, 255, 255, 0.1); /* Added border */
  position: relative; /* Added for ::before */
  overflow: hidden; /* Added for ::before */
  margin-bottom: 1rem; /* Added margin-bottom for spacing */

  &::before { /* Added ::before for gradient effect */
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    pointer-events: none;
  }
`;

const Title = styled(Text)`
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a1a;
`;

const ContentList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  max-width: 800px;
`;

const ContentItem = styled(motion.li)`
  background: #fff;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  display: block;
  white-space: normal;
  word-wrap: break-word;
  max-width: 100%;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    pointer-events: none;
  }
`;

const SlideText = ({ currentQuestion }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  // Xử lý content thành các phần
  const contentParts = currentQuestion.content
    ? currentQuestion.content.split('\n').filter(part => part.trim() !== '')
    : [];

  return (
    <AnimatePresence>
      <SlideContainer
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {currentQuestion.title && (
          <TitleContainer variants={itemVariants}>
            <Title>{currentQuestion.title}</Title>
          </TitleContainer>
        )}

        {contentParts.length > 0 && (
          <ContentList>
            {contentParts.map((part, index) => (
              <ContentItem
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {part}
              </ContentItem>
            ))}
          </ContentList>
        )}
      </SlideContainer>
    </AnimatePresence>
  );
};

export default SlideText; 