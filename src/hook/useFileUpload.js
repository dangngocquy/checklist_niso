import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { message } from 'antd';
import { v4 } from 'uuid';

const useFileUpload = (storage, folderPath) => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState(null);

  const uploadFile = (file, onSuccess) => {
    if (!file) {
      message.warning('Please select a file!');
      return;
    }

    setIsUploading(true);
    const fileRef = ref(storage, `${folderPath}/${v4()}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(parseFloat(progress.toFixed(2)));
      },
      (error) => {
        console.error('Upload error:', error);
        message.error('Failed to upload file');
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUrl(downloadURL);
          onSuccess(downloadURL);
          setIsUploading(false);
        });
      }
    );
  };

  return { progress, isUploading, url, uploadFile };
};

export default useFileUpload;