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
  min-height: calc(-200px + 100vh);
  gap: 1.5rem;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    gap: 1.5rem;
    min-height: auto;
  }
`;

const ImageSection = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  position: relative;
`;

const ImageWrapper = styled(motion.div)`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  height: 400px;

  @media (max-width: 768px) {
    height: 300px;
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

const ContentSection = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  z-index: 1;
  position: relative;
`;

const StyledQuote = styled(motion.div)`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 2rem 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  color: #2c3e50;
  font-weight: 600 !important;
  font-size: 1.8rem !important;
  line-height: 1.6 !important;
  position: relative;
  overflow: hidden;
  width: 100%;
  word-wrap: break-word;
  white-space: normal;
  font-style: italic;
  text-align: left;
  border-left: 5px solid #2c3e50;

  &::before {
    content: '"';
    position: absolute;
    top: -20px;
    left: 10px;
    font-size: 120px;
    color: rgba(52, 152, 219, 0.1);
    font-family: Georgia, serif;
  }

  @media (max-width: 768px) {
    font-size: 1.4rem !important;
    padding: 1.5rem 2rem;
  }
`;

const StyledAuthor = styled(motion.div)`
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  color: #34495e !important;
  font-size: 1.1rem !important;
  line-height: 1.6 !important;
  font-weight: 500 !important;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  display: block;
  white-space: normal;
  word-wrap: break-word;
  width: 100%;
  text-align: center;
  margin-top: 1rem;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(52, 152, 219, 0.05) 0%,
      transparent 50%,
      rgba(52, 152, 219, 0.05) 100%
    );
    pointer-events: none;
  }

  @media (max-width: 768px) {
    font-size: 1rem !important;
  }
`;

const SlideQuote = ({ currentQuestion }) => {
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

  const imageVariants = {
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

  const quoteVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.2,
      },
    },
  };

  const authorVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        delay: 0.3,
      },
    },
  };

  const imageHoverVariants = {
    hover: {
      scale: 1.05,
      rotate: 1,
      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
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
        <AnimatePresence>
          {currentQuestion.image && (
            <ImageSection variants={imageVariants}>
              <ImageWrapper
                variants={imageHoverVariants}
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
            </ImageSection>
          )}
        </AnimatePresence>

        <ContentSection>
          <StyledQuote
            variants={quoteVariants}
            whileHover={{
              scale: 1.02,
            }}
            transition={{ duration: 0.2 }}
          >
            "{currentQuestion.quote || 'No Quote'}"
          </StyledQuote>
          
          <AnimatePresence>
            {currentQuestion.author && (
              <StyledAuthor
                variants={authorVariants}
                whileHover={{
                  scale: 1.02,
                }}
                transition={{ duration: 0.2 }}
              >
                - {currentQuestion.author}
              </StyledAuthor>
            )}
          </AnimatePresence>
        </ContentSection>
      </SlideContainer>
    </AnimatePresence>
  );
};

export default SlideQuote; 