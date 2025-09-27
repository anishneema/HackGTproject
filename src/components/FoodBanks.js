import React, { useState, useEffect } from 'react';
import Header from './Header';
import SearchBar from './foodbanks/SearchBar';
import Filters from './foodbanks/Filters';
import FoodBankCard from './foodbanks/FoodBankCard';
import './FoodBanks.css';

const FoodBanks = ({ currentPage, onPageChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    distance: '10',
    type: 'all',
    accepts: 'all',
    rating: 'all'
  });
  const [foodBanks, setFoodBanks] = useState([]);
  const [filteredFoodBanks, setFilteredFoodBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sample food bank data
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        name: "Atlanta Community Food Bank",
        address: "732 Joseph E Lowery Blvd NW, Atlanta, GA 30318",
        phone: "(404) 892-9822",
        website: "https://acfb.org",
        description: "Serving metro Atlanta and north Georgia with fresh food donations, volunteer opportunities, and community programs.",
        type: "community",
        accepts: ["fresh-produce", "prepared-foods", "non-perishables"],
        distance: 2.3,
        rating: 4.8,
        hours: "Mon-Fri: 8AM-5PM",
        incentives: ["Tax deduction receipts", "Recognition on website", "Volunteer opportunities"],
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400"
      },
      {
        id: 2,
        name: "Second Harvest Food Bank",
        address: "1640 Dodson Ave, Chattanooga, TN 37406",
        phone: "(423) 622-1800",
        website: "https://secondharvestmetroatlanta.org",
        description: "Fighting hunger and feeding hope through food distribution, nutrition education, and advocacy programs.",
        type: "regional",
        accepts: ["fresh-produce", "prepared-foods", "non-perishables", "dairy"],
        distance: 5.7,
        rating: 4.6,
        hours: "Mon-Thu: 7AM-4PM, Fri: 7AM-2PM",
        incentives: ["Monthly donor recognition", "Community impact reports", "Partnership opportunities"],
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
      },
      {
        id: 3,
        name: "Midtown Assistance Center",
        address: "769 Juniper St NE, Atlanta, GA 30308",
        phone: "(404) 681-5840",
        website: "https://midtownassistancecenter.org",
        description: "Providing emergency food assistance, financial aid, and support services to families in need.",
        type: "local",
        accepts: ["non-perishables", "fresh-produce"],
        distance: 1.8,
        rating: 4.9,
        hours: "Mon-Thu: 9AM-4PM",
        incentives: ["Direct community impact", "Local business partnerships", "Media recognition"],
        image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400"
      },
      {
        id: 4,
        name: "Open Hand Atlanta",
        address: "181 Armour Dr NE, Atlanta, GA 30324",
        phone: "(404) 872-2707",
        website: "https://openhandatlanta.org",
        description: "Preparing and delivering nutritious meals to seniors and people with chronic diseases.",
        type: "specialized",
        accepts: ["prepared-foods", "fresh-produce"],
        distance: 3.2,
        rating: 4.7,
        hours: "Mon-Fri: 7AM-6PM",
        incentives: ["Health impact reporting", "Senior community partnerships", "Corporate volunteer programs"],
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400"
      },
      {
        id: 5,
        name: "Atlanta Mission",
        address: "2353 Bolton Rd NW, Atlanta, GA 30318",
        phone: "(404) 817-1500",
        website: "https://atlantamission.org",
        description: "Serving homeless and near-homeless individuals with meals, shelter, and recovery programs.",
        type: "community",
        accepts: ["prepared-foods", "non-perishables", "fresh-produce"],
        distance: 4.1,
        rating: 4.5,
        hours: "24/7 Emergency Services",
        incentives: ["Homelessness impact stories", "Recovery program partnerships", "Emergency response recognition"],
        image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"
      },
      {
        id: 6,
        name: "Meals on Wheels Atlanta",
        address: "1705 Commerce Dr NW, Atlanta, GA 30318",
        phone: "(404) 351-3889",
        website: "https://mealsonwheelsatlanta.org",
        description: "Delivering nutritious meals to homebound seniors and adults with disabilities.",
        type: "specialized",
        accepts: ["prepared-foods", "fresh-produce"],
        distance: 6.3,
        rating: 4.8,
        hours: "Mon-Fri: 8AM-4PM",
        incentives: ["Senior wellness impact", "Home delivery partnerships", "Community health recognition"],
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400"
      }
    ];
    setFoodBanks(sampleData);
    setFilteredFoodBanks(sampleData);
  }, []);

  // Filter and search logic
  useEffect(() => {
    setIsLoading(true);
    
    let filtered = foodBanks.filter(foodBank => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          foodBank.name.toLowerCase().includes(query) ||
          foodBank.address.toLowerCase().includes(query) ||
          foodBank.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Distance filter
      if (filters.distance && filters.distance !== 'all') {
        if (foodBank.distance > parseFloat(filters.distance)) return false;
      }

      // Type filter
      if (filters.type && filters.type !== 'all') {
        if (foodBank.type !== filters.type) return false;
      }

      // Accepts filter
      if (filters.accepts && filters.accepts !== 'all') {
        if (!foodBank.accepts.includes(filters.accepts)) return false;
      }

      // Rating filter
      if (filters.rating && filters.rating !== 'all') {
        const minRating = parseFloat(filters.rating);
        if (foodBank.rating < minRating) return false;
      }

      return true;
    });

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    setTimeout(() => {
      setFilteredFoodBanks(filtered);
      setIsLoading(false);
    }, 300);
  }, [searchQuery, filters, foodBanks]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  return (
    <div className="food-banks">
      <Header currentPage={currentPage} onPageChange={onPageChange} />
      
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Donations</h1>
            <p className="page-description">
              Find local donation hubs to donate surplus food and reduce waste. 
              Help feed your community while getting tax benefits and recognition.
            </p>
          </div>

          <div className="search-section">
            <SearchBar onSearch={handleSearch} />
            <Filters filters={filters} onFilterChange={handleFilterChange} />
          </div>

          <div className="results-section">
            <div className="results-header">
              <h2 className="results-title">
                {isLoading ? 'Searching...' : `${filteredFoodBanks.length} Donation Hubs Found`}
              </h2>
              {searchQuery && (
                <p className="search-query">Results for "{searchQuery}"</p>
              )}
            </div>

            <div className="food-banks-grid">
              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : filteredFoodBanks.length > 0 ? (
                filteredFoodBanks.map(foodBank => (
                  <FoodBankCard key={foodBank.id} foodBank={foodBank} />
                ))
              ) : (
                <div className="no-results">
                  <h3>No donation hubs found</h3>
                  <p>Try adjusting your search criteria or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FoodBanks;
