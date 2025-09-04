import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const SlideContainer = styled(motion.div)`
  display: flex;
  position: relative;
  transition: all 0.3s ease;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    align-items: normal;
    min-height: auto;
  }
`;

const Title = styled(motion.h2)`
  background: #fff;
  padding: 1.5rem 2rem;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #333;
  font-weight: 700 !important;
  font-size: 2.5rem !important;
  line-height: 1.2 !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  max-width: 80%;
  word-wrap: break-word;
  white-space: normal;
  text-align: center;

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

  @media (max-width: 768px) {
    font-size: 2rem !important;
    max-width: 100%;
  }
`;

const Content = styled(motion.div)`
  background: #fff;
  color: #333 !important;
  font-size: 1.2rem !important;
  line-height: 1.6 !important;
  font-weight: 500 !important;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  display: block;
  white-space: normal;
  word-wrap: break-word;
  max-width: 80%;
  text-align: center;

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

  @media (max-width: 768px) {
    font-size: 1.1rem !important;
    max-width: 100%;
  }
`;

const ImageWrapper = styled(motion.div)`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  width: 80%;
  max-width: 600px;
  height: 300px;

  @media (max-width: 768px) {
    width: 100%;
    height: 200px;
  }
`;

const BackgroundImage = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  border-radius: 12px;
`;

const Overlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
`;

const SlideImage = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  position: relative;
  z-index: 2;
`;

const SlideClassic = ({ currentQuestion }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        delay: 0.2,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.4,
      },
    },
  };

  return (
    <AnimatePresence>
      <SlideContainer
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {currentQuestion.title && (
          <Title
            variants={titleVariants}
            whileHover={{
              scale: 1.02,
            }}
            transition={{ duration: 0.2 }}
          >
            {currentQuestion.title}
          </Title>
        )}

        {currentQuestion.image && (
          <ImageWrapper
            variants={imageVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <BackgroundImage imageUrl={currentQuestion.image.url} />
            <Overlay />
            <SlideImage
              src={currentQuestion.image.url}
              alt="Slide"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </ImageWrapper>
        )}

        {currentQuestion.content && (
          <Content
            variants={contentVariants}
            whileHover={{
              scale: 1.02,
            }}
            transition={{ duration: 0.2 }}
          >
            {currentQuestion.content}
          </Content>
        )}
      </SlideContainer>
    </AnimatePresence>
  );
};

export default SlideClassic; 