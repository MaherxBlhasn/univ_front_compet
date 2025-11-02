import sys
import os

# Set UTF-8 encoding for stdout/stderr to handle emojis and special characters
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Get the directory where this script is located
backend_dir = os.path.dirname(os.path.abspath(__file__))

# Add backend directory to Python path
sys.path.insert(0, backend_dir)

# Now import and run the app
if __name__ == '__main__':
    from app import app
    # Disable debug mode to prevent reloader issues with embedded Python
    # Use 127.0.0.1 (localhost only) instead of 0.0.0.0 for security
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
