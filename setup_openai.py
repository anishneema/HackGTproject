#!/usr/bin/env python3
"""
Setup script for OpenAI API integration
This script helps set up the environment for the OpenAI API integration
"""

import os
import sys

def create_env_file():
    """Create .env file with OpenAI API key"""
    api_key = input("Enter your OpenAI API key: ").strip()
    
    if not api_key:
        print("Error: API key cannot be empty")
        return False
    
    env_content = f"# OpenAI API Configuration\nOPENAI_API_KEY={api_key}\n"
    
    try:
        with open("api/.env", "w") as f:
            f.write(env_content)
        print("✅ .env file created successfully in api/ directory")
        return True
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import openai
        import flask
        import pandas
        import xgboost
        import joblib
        print("✅ All required Python packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r api/requirements.txt")
        return False

def main():
    print("🚀 OpenAI API Integration Setup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists("api/api.py"):
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Create .env file
    if create_env_file():
        print("\n🎉 Setup complete!")
        print("\nNext steps:")
        print("1. Start the Flask server: cd api && python api.py")
        print("2. Start the React app: npm start")
        print("3. Test the integration in the Demand Calculator")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()

