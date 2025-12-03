import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const UploadBook = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [url, setUrl] = useState('');

  const handleUpload = async () => {
    try {
      await addDoc(collection(db, 'books'), { title, author, url });
      console.log('Book uploaded!');
    } catch (error) {
      console.error('Error uploading book:', error);
    }
  };

  return (
    <div>
      <h1>Upload Book</h1>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Book Title" />
      <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author" />
      <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Book URL" />
      <button onClick={handleUpload}>Upload Book</button>
    </div>
  );
};

export default UploadBook;
