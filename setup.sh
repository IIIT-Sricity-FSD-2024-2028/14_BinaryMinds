#!/bin/bash
echo "==================================================="
echo "Setting up Digital Governance License System Project"
echo "==================================================="

echo ""
echo "[1/2] Setting up Backend Environment..."
cd backend || exit

if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
else
    echo "📄 .env already exists."
fi

echo ""
echo "[2/2] Installing Backend Dependencies..."
npm install

cd ..

echo ""
echo "==================================================="
echo "✅ Setup Complete!"
echo "==================================================="
echo ""
echo "To start the development server, run:"
echo "  cd backend"
echo "  npm run start:dev"
echo ""
