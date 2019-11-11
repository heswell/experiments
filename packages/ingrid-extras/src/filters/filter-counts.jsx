import React from 'react';

export function FilterCounts({ column, dataCounts/*, searchText*/ }) {
  const { dataRowTotal, dataRowAllFilters, filterRowTotal, filterRowSelected } = dataCounts;
  return (
      <div className="filter-count-section">
          <div className="filter-row-counts">
              <div>{`Distinct values for ${column.name}`}</div>
              <div className="filter-row-table">
                  <div>
                      <span>Selected</span>
                      <span>{filterRowSelected}</span>
                  </div>
                  <div>
                      <span>Total</span>
                      <span>{filterRowTotal}</span>
                  </div>
              </div>
          </div>
          <div className="data-row-counts">
              <div>{`Data records`}</div>
              <div className="filter-row-table">
                  {dataRowAllFilters < dataRowTotal ? (
                      <div>
                          <span>Filtered</span>
                          <span>{dataRowAllFilters}</span>
                      </div>

                  ) : (
                          <div>
                              <span>&nbsp;</span>
                              <span>&nbsp;</span>
                          </div>
                      )}
                  <div>
                      <span>Total</span>
                      <span>{dataRowTotal}</span>
                  </div>
              </div>

          </div>
      </div>
  )
}
