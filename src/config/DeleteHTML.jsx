const DeleteHTML = (content) => {
    if (content === undefined || content === null) {
        return ''; 
    }
    return content.replace(/<\/?[^>]+(>|$)|&nbsp;/g, "");
};

export default DeleteHTML;