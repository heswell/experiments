import React from 'react';

export function FilterCounts({ column, stats/*, searchText*/ }) {
  const { totalRowCount, filteredRowCount, filteredSelected } = stats;
  return (
      <div className="filter-count-section">
          <div className="filter-row-counts">
              <div>{`Distinct values for ${column.name}`}</div>
              <div className="filter-row-table">
                  <div>
                      <span>Selected</span>
                      <span>{filteredSelected}</span>
                  </div>
                  <div>
                      <span>Total</span>
                      <span>{filteredRowCount}</span>
                  </div>
              </div>
          </div>
          <div className="data-row-counts">
              <div>{`Data records`}</div>
              <div className="filter-row-table">
                  <div>
                      <span>Total</span>
                      <span>{totalRowCount}</span>
                  </div>
              </div>

          </div>
      </div>
  )
}
