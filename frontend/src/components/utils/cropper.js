import React, { useState, useRef, useEffect } from 'react';
import 'cropperjs/dist/cropper.min.css';
import Cropper from 'cropperjs';

const CropperComponent = ({ onCropComplete, file, aspectRatio = 1, className = '', isVisible }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [cropper, setCropper] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const imageRef = useRef(null);
  const [savedCropData, setSavedCropData] = useState(null);

  // Update image URL whenever the file changes
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  // Initialize the cropper when the image URL is ready
  useEffect(() => {
    if (isVisible && imageUrl && imageRef.current) {
        const newCropper = new Cropper(imageRef.current, {
            aspectRatio,
            viewMode: 1, // Adjust the view mode (image is contained within the container)
            autoCropArea: 0.8, // Adjust the initial crop area (80% of the container)
            responsive: true, // Make the cropper responsive
            checkOrientation: false, // Disable checking for image orientation (to avoid issues with some images)
            ready() {
                console.log('Cropper is ready!');
                setIsReady(true);
        
                // Restore saved crop settings if available
                if (savedCropData) {
                    newCropper.setData(savedCropData);
                }
            },
            cropend() {
                // Save crop settings after cropping ends
                const cropData = newCropper.getData();
                setSavedCropData(cropData);
            },
        });
    
        setCropper(newCropper);
        // Cleanup cropper instance on component unmount
        return () => {
            if (newCropper) {
                newCropper.destroy();
            }
        };
    }
  }, [isVisible, imageUrl, aspectRatio, savedCropData]); // Removed cropper from dependency list

  // Handle the crop action and return the cropped image
  const handleCrop = () => {
    console.log('Handling crop...'); // Debugging log
    if (isReady && cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        const croppedImage = croppedCanvas.toDataURL();
        console.log('Cropped image data:', croppedImage); // Debugging log
        onCropComplete(croppedImage); // Return the cropped image to the parent

        // Reset the cropper and image after the crop
        // setImageUrl(null); // Clear the image URL
        // setIsReady(false); // Reset the cropper ready state
      } else {
        console.error('Cropper canvas is not ready');
      }
    } else {
      console.error('Cropper instance is not initialized');
    }
  };

  return isVisible ? (
        <div className="absolute bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.25)] 
                          rounded-lg p-6 lg:mt-20 mt-[8rem] z-20">
            <div className={`relative ${className} -mb-1`}>
                {imageUrl ? (
                <>
                    <div className="w-full max-w-[300px] max-h-[300px] bg-white rounded-lg">
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Crop me"
                            className="object-cover w-full h-full rounded-lg" 
                        />
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleCrop}
                            className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded 
                                hover:from-blue-500 hover:to-blue-600 hover:scale-105 transition"
                            disabled={!isReady}
                        >
                            Crop Image
                        </button>
                    </div>
                </>
                ) : (
                <p>No image selected</p>
                )}
            </div>
        </div>
    ) : null;
};

export default CropperComponent;
