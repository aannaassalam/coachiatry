import { useState, DragEvent, ChangeEvent } from "react";
import { RxCross1 } from "react-icons/rx";
import { FaFileAlt } from "react-icons/fa";

interface ChatUploadProps {
  handleUpload: (files: File[]) => void;
  setChatDragShow: (show: boolean) => void;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function ChatUploadWithPreview({
  handleUpload,
  setChatDragShow,
  files,
  setFiles
}: ChatUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const resetAll = () => {
    setFiles([]);
    setShowPreview(false);
    setChatDragShow(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const updated = [...files, ...droppedFiles];
      setFiles(updated);
      setShowPreview(true);
      handleUpload(updated);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const updated = [...files, ...selectedFiles];
      setFiles(updated);
      setShowPreview(true);
      handleUpload(updated);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (updated.length === 0) setShowPreview(false);
    else if (selectedFileIndex >= updated.length)
      setSelectedFileIndex(updated.length - 1);
  };
  console.log(showPreview);
  return (
    <div className="sticky w-full h-full inset-0 bg-gray-50 flex justify-center items-center z-50 p-4 max-md:px-0">
      {/* Single Close Button */}
      <button
        onClick={resetAll}
        className="absolute top-5 right-6 max-md:right-0 text-gray-700 hover:text-black transition cursor-pointer"
      >
        <RxCross1 size={25} />
      </button>

      {/* Preview Section */}
      {files.length > 0 ? (
        <div className="flex flex-col items-center w-full h-full overflow-hidden">
          <div className="flex justify-between items-center w-full max-w-3xl mb-2">
            <p className="text-gray-800 font-semibold text-lg truncate max-w-[85%]">
              {files[selectedFileIndex]?.name}
            </p>
          </div>

          {/* ✅ Adjusted Preview Area Height */}
          <div className="flex-1 flex justify-center items-center w-full max-h-[60%] my-auto">
            {files[selectedFileIndex]?.type.includes("video") ? (
              <video
                controls
                className="max-w-[70%] max-h-[100%] rounded-lg shadow-md object-contain"
              >
                <source
                  src={URL.createObjectURL(files[selectedFileIndex])}
                  type={files[selectedFileIndex].type}
                />
              </video>
            ) : files[selectedFileIndex]?.type.includes("image") ? (
              <img
                src={URL.createObjectURL(files[selectedFileIndex])}
                alt="Preview"
                className="max-w-[70%] max-h-[100%] rounded-lg shadow-md object-contain"
              />
            ) : (
              <div className="text-2xl text-gray-800 font-semibold flex flex-col justify-center items-center">
                <FaFileAlt className="mb-2" />
                No Preview
              </div>
            )}
          </div>

          {/* ✅ Improved Thumbnail Strip with Hover Delete Button */}
          <div className="pt-3 mt-auto px-4 flex justify-center items-center border-t border-t-gray-200 overflow-x-auto w-full max-w-3xl gap-2 pb-2">
            {files.map((file, i) => (
              <div
                key={i}
                className={`relative group border rounded-md p-1 cursor-pointer transition ${
                  selectedFileIndex === i
                    ? "border-green-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => setSelectedFileIndex(i)}
              >
                {file.type.includes("image") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="thumb"
                    className="w-[50px] h-[50px] object-cover rounded-md"
                  />
                ) : file.type.includes("video") ? (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-[50px] h-[50px] object-cover rounded-md"
                  />
                ) : (
                  <FaFileAlt className="w-[50px] h-[50px] text-gray-600 p-2" />
                )}

                {/* ❌ Hover Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(i);
                  }}
                  className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <RxCross1 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Upload Section
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl flex flex-col justify-center items-center w-[90%] max-w-xl h-[60%] transition-all ${
            dragActive
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-white"
          }`}
        >
          <input
            type="file"
            multiple
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <FaFileAlt className="text-4xl text-gray-700 mb-3" />
          <p className="text-2xl text-gray-800 font-semibold">
            Drag & Drop files here
          </p>
          <p className="text-gray-500 mt-2 text-sm">or click to browse</p>
          {files.length > 0 && (
            <div className="mt-5 w-full max-w-sm bg-gray-100 rounded-lg p-3 overflow-y-auto max-h-40">
              <p className="text-gray-700 text-sm font-medium mb-2">
                {files.length} file(s) selected:
              </p>
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-white rounded p-2 mb-1 shadow-sm"
                >
                  <span
                    onClick={() => {
                      setSelectedFileIndex(i);
                      setShowPreview(true);
                    }}
                    className="truncate text-gray-700 text-sm cursor-pointer hover:text-green-600"
                  >
                    {file.name}
                  </span>
                  <button
                    onClick={() => handleRemoveFile(i)}
                    className="text-red-500 hover:text-red-600 text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
