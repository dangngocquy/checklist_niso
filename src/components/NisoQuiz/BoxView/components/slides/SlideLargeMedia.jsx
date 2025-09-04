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
  max-width: 1000px;
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
  height: 600px;

  @media (max-width: 768px) {
    height: 400px;
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

const CaptionSection = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  z-index: 1;
  position: relative;
`;

const StyledCaption = styled(motion.div)`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  color: #2c3e50;
  font-weight: 500;
  font-size: 1.2rem;
  line-height: 1.6;
  position: relative;
  overflow: hidden;
  width: 100%;
  word-wrap: break-word;
  white-space: normal;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 1rem 1.5rem;
  }
`;

const SlideLargeMedia = ({ currentQuestion }) => {
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

  const captionVariants = {
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

        {currentQuestion.caption && (
          <CaptionSection>
            <StyledCaption
              variants={captionVariants}
              whileHover={{
                scale: 1.02,
              }}
              transition={{ duration: 0.2 }}
            >
              {currentQuestion.caption}
            </StyledCaption>
          </CaptionSection>
        )}
      </SlideContainer>
    </AnimatePresence>
  );
};

export default SlideLargeMedia; 