import { useState, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';

const useImagePicker = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [giphyResults, setGiphyResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState('trending');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeResults, setYoutubeResults] = useState([]);

    const fetchTrendingGifs = async () => {
        setLoading(true);
        try {
            const response = await axios.get('https://api.giphy.com/v1/gifs/trending', {
                params: {
                    api_key: process.env.REACT_APP_GIPHY_API_KEY,
                    limit: 20,
                    rating: 'g',
                },
            });
            const gifs = response.data.data.map(gif => ({
                id: gif.id,
                title: gif.title,
                url: gif.images?.fixed_height?.url || gif.images?.original?.url,
                type: 'gif'
            }));
            setGiphyResults(gifs);
        } catch (error) {
            console.error('Giphy Trending API error:', error);
            message.error('Không thể tải GIF đang thịnh hành. Vui lòng kiểm tra API key hoặc kết nối mạng.');
        }
        setLoading(false);
    };

    const fetchStickers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('https://api.giphy.com/v1/stickers/trending', {
                params: {
                    api_key: process.env.REACT_APP_GIPHY_API_KEY,
                    limit: 20,
                    rating: 'g',
                },
            });
            const stickers = response.data.data.map(sticker => ({
                id: sticker.id,
                title: sticker.title,
                url: sticker.images?.fixed_height?.url || sticker.images?.original?.url,
                type: 'sticker'
            }));
            setGiphyResults(stickers);
        } catch (error) {
            console.error('Giphy Stickers API error:', error);
            message.error('Không thể tải Sticker. Vui lòng kiểm tra API key hoặc kết nối mạng.');
        }
        setLoading(false);
    };

    const searchGiphy = async (query) => {
        if (!query) {
            if (selectedMenu === 'trending') {
                fetchTrendingGifs();
            } else if (selectedMenu === 'stickers') {
                fetchStickers();
            }
            return;
        }
        setLoading(true);
        try {
            const endpoint = selectedMenu === 'stickers' ? 'stickers' : 'gifs';
            const response = await axios.get(`https://api.giphy.com/v1/${endpoint}/search`, {
                params: {
                    api_key: process.env.REACT_APP_GIPHY_API_KEY,
                    q: query,
                    limit: 20,
                    rating: 'g',
                },
            });
            const results = response.data.data.map(item => ({
                id: item.id,
                title: item.title,
                url: item.images?.fixed_height?.url || item.images?.original?.url,
                type: selectedMenu === 'stickers' ? 'sticker' : 'gif'
            }));
            setGiphyResults(results);
        } catch (error) {
            console.error('Giphy Search API error:', error);
            message.error('Không thể tìm kiếm hình ảnh từ Giphy. Vui lòng kiểm tra API key hoặc kết nối mạng.');
        }
        setLoading(false);
    };

    const searchYouTube = async (url) => {
        if (!url) {
            message.warning('Vui lòng nhập link YouTube!');
            return;
        }
        
        setLoading(true);
        try {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
                const mockResult = {
                    id: videoId,
                    title: 'YouTube Video',
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    url: url,
                    type: 'youtube'
                };
                setYoutubeResults([mockResult]);
                message.success('Đã tìm thấy video YouTube!');
            } else {
                message.error('Link YouTube không hợp lệ!');
            }
        } catch (error) {
            console.error('YouTube search error:', error);
            message.error('Không thể tìm kiếm video YouTube.');
        }
        setLoading(false);
    };

    const extractYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    useEffect(() => {
        if (isModalVisible && selectedMenu === 'trending' && !searchTerm) {
            fetchTrendingGifs();
        } else if (isModalVisible && selectedMenu === 'stickers' && !searchTerm) {
            fetchStickers();
        }
    }, [isModalVisible, selectedMenu, searchTerm]);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        if (fileList.length === 0) {
            message.warning('Vui lòng chọn ít nhất một hình ảnh!');
            return;
        }
        message.success('Đã chọn hình ảnh thành công!');
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSearchTerm('');
        setYoutubeUrl('');
        setGiphyResults([]);
        setYoutubeResults([]);
        setSelectedMenu('trending');
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (selectedMenu !== 'youtube') {
            if (value.length > 2) {
                searchGiphy(value);
            } else {
                if (selectedMenu === 'trending') {
                    fetchTrendingGifs();
                } else if (selectedMenu === 'stickers') {
                    fetchStickers();
                }
            }
        }
    };

    const handleMenuSelect = ({ key }) => {
        setSelectedMenu(key);
        setSearchTerm('');
        setYoutubeUrl('');
        setGiphyResults([]);
        setYoutubeResults([]);
        
        if (key === 'trending') {
            fetchTrendingGifs();
        } else if (key === 'stickers') {
            fetchStickers();
        }
    };

    const handleSelectGiphy = (item) => {
        const newFile = {
            uid: item.id,
            name: item.title || `${item.type}-image`,
            status: 'done',
            url: item.type === 'youtube' ? `https://www.youtube.com/embed/${item.id}` : item.url,
            originalUrl: item.url,
            type: item.type
        };
        setFileList([newFile]); // Replace fileList with a single item
    };

    const handleYouTubeSearch = () => {
        searchYouTube(youtubeUrl);
    };

    return {
        isModalVisible,
        fileList,
        searchTerm,
        giphyResults,
        loading,
        selectedMenu,
        youtubeUrl,
        youtubeResults,
        showModal,
        handleOk,
        handleCancel,
        handleSearch,
        handleMenuSelect,
        handleSelectGiphy,
        handleYouTubeSearch,
        setYoutubeUrl,
        setFileList
    };
};

export default useImagePicker;