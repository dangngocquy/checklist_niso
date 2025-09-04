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
  gap: 1.5rem;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    display: block;
    gap: 1.5rem;
    min-height: auto;
  }
`;

const ContentSection = styled(motion.div)`
  flex: 0.6;
  z-index: 1;
  position: relative;
  padding-right: 1rem;
  max-width: 60%;

  @media (max-width: 768px) {
    padding-right: 0;
    text-align: center;
    max-width: 100%;
  }
`;

const BulletList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BulletItem = styled(motion.li)`
  background: #fff;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  display: block;
  white-space: normal;
  word-wrap: break-word;
  max-width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
    text-align: left;
    width: 100%;
  }

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

const ImageSection = styled(motion.div)`
  flex: 0.4;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  position: relative;
  max-width: 40%;

  @media (max-width: 768px) {
    width: 100%;
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

const SlideBullets = ({ currentQuestion }) => {
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

  const itemVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
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
        <ContentSection>
          <BulletList>
            {currentQuestion.items?.filter(item => item && item.trim() !== '').map((item, index) => (
              <BulletItem
                key={index}
                variants={itemVariants}
                whileHover={{
                  scale: 1.02,
                }}
                transition={{ duration: 0.2 }}
              >
                <Text>{item}</Text>
              </BulletItem>
            ))}
          </BulletList>
        </ContentSection>

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
      </SlideContainer>
    </AnimatePresence>
  );
};

export default SlideBullets; 