import { useState } from 'react';
import './styles/PDFReview.css';

interface PDFReviewProps {
  images: string[];
}

const layoutOptions = [
  { id: 'grid-2x2', name: 'Grid 2x2' },
  { id: 'full-width', name: 'Full-width Image' },
  { id: 'stack-3', name: '3 Images Stacked' }
];

function PDFReview({ images = [] }: PDFReviewProps) {
  // State for image order and layout
  const [orderedImages, setOrderedImages] = useState<string[]>(images);
  const [selectedLayout, setSelectedLayout] = useState<string>(layoutOptions[0].id);
  const [cropData, setCropData] = useState<Record<string, { zoom?: number; crop?: any }>>({}); // { [imgUrl]: { zoom, crop } }

  // Drag & drop handlers
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.setData('imgIdx', idx.toString());
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    const fromIdx = Number(e.dataTransfer.getData('imgIdx'));
    if (fromIdx === idx) return;
    const newOrder = [...orderedImages];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(idx, 0, moved);
    setOrderedImages(newOrder);
  };

  // Layout selection
  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLayout(e.target.value);
  };

  // Crop/zoom handlers
  const handleZoom = (imgUrl: string, delta: number) => {
    setCropData(prev => ({
      ...prev,
      [imgUrl]: {
        ...(prev[imgUrl] || {}),
        zoom: Math.max(1, (prev[imgUrl]?.zoom || 1) + delta)
      }
    }));
  };
  const handleCrop = (imgUrl: string, crop: any) => {
    setCropData(prev => ({
      ...prev,
      [imgUrl]: {
        ...(prev[imgUrl] || {}),
        crop
      }
    }));
  };

  // Live preview rendering
  const renderPreview = () => {
    switch (selectedLayout) {
      case 'grid-2x2':
        return (
          <div className="preview-grid-2x2">
            {orderedImages.slice(0, 4).map((img) => (
              <div key={img} className="preview-img-cell">
                <img src={img} alt="preview" className="preview-img-cell" style={{ transform: `scale(${cropData[img]?.zoom || 1})` }} />
              </div>
            ))}
          </div>
        );
      case 'full-width':
        return (
          <div className="preview-full-width">
            {orderedImages.slice(0, 1).map((img) => (
              <img key={img} src={img} alt="preview" className="preview-full-width" style={{ transform: `scale(${cropData[img]?.zoom || 1})` }} />
            ))}
          </div>
        );
      case 'stack-3':
        return (
          <div className="preview-stack-3">
            {orderedImages.slice(0, 3).map((img) => (
              <img key={img} src={img} alt="preview" className="preview-stack-3" style={{ transform: `scale(${cropData[img]?.zoom || 1})` }} />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pdf-review-page">
      <h2>Photo Review & Layout Customizer</h2>
      <div className="review-controls">
        <label>Choose Layout:</label>
        <select value={selectedLayout} onChange={handleLayoutChange}>
          {layoutOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>
      <div className="review-images-list">
        {orderedImages.map((img, idx) => (
          <div
            key={img}
            className="review-img-item"
            draggable
            onDragStart={e => onDragStart(e, idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, idx)}
          >
            <img src={img} alt="review" className="review-img-item" style={{ transform: `scale(${cropData[img]?.zoom || 1})` }} />
            <div className="img-tools">
              <button onClick={() => handleZoom(img, 0.1)}>Zoom +</button>
              <button onClick={() => handleZoom(img, -0.1)}>Zoom -</button>
              {/* Crop tool stub: could open a modal/cropper */}
            </div>
          </div>
        ))}
      </div>
      <div className="review-preview">
        <h3>Live Preview</h3>
        {renderPreview()}
      </div>
    </div>
  );
}

export default PDFReview;
