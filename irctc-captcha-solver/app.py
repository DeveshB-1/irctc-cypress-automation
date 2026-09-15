import sys
import easyocr

if __name__ == '__main__':
    # Pre-load EasyOCR model as expected by the GitHub Actions workflow
    reader = easyocr.Reader(["en"], model_storage_directory="./EasyOCR")
    print("EasyOCR models pre-loaded successfully!")
