/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import Button from 'reactstrap/lib/Button';
import matchSorter from 'match-sorter';
import ReactTable from '../Styled/Table';
import TransactionView from '../View/TransactionView';
import DatePicker from '../Styled/DatePicker';

import compose from 'recompose/compose';
import { gql } from 'apollo-boost';
import { graphql } from 'react-apollo';

const styles = (theme) => {
  const { type } = theme.palette;
  const dark = type === 'dark';
  return {
    hash: {
      '&, & li': {
        overflow: 'visible !important',
      },
    },
    partialHash: {
      textAlign: 'center',
      position: 'relative !important',
      '&:hover $lastFullHash': {
        marginLeft: -400,
      },
      '&:hover $fullHash': {
        display: 'block',
        position: 'absolute !important',
        padding: '4px 4px',
        backgroundColor: dark ? '#5e558e' : '#000000',
        marginTop: -30,
        marginLeft: -215,
        borderRadius: 8,
        color: '#ffffff',
        opacity: dark ? 1 : undefined,
      },
    },
    fullHash: {
      display: 'none',
    },
    lastFullHash: {},
    filter: {
      width: '100%',
      textAlign: 'center',
      margin: '0px !important',
    },
    filterButton: {
      opacity: 0.8,
      margin: 'auto',
      width: '100% !important',
      'margin-bottom': '4px',
    },
    searchButton: {
      opacity: 0.8,
      margin: 'auto',
      width: '100% !important',
      backgroundColor: dark ? undefined : '#086108',
      'margin-bottom': '4px',
    },
    filterElement: {
      textAlign: 'center',
      display: 'flex',
      padding: '0px !important',
      '& > div': {
        width: '100% !important',
        marginTop: 20,
      },
      '& .label': {
        margin: '25px 10px 0px 10px',
      },
    },
  };
};

export class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      to: null,
      options: [],
      filtered: [],
      sorted: [],
      from: null,
    };
  }

  timeError() {
    const { from, to } = this.state;
    return from !== null && to !== null && from > to;
  }

  handleDialogOpen = async (tid) => {
    this.setState({ dialogOpen: true, transaction: tid });
  };

  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  handleSearch = async () => {
    const { from, to } = this.state;
    this.props.refetch({
      timeAfter: from === null ? null : from.toISOString(),
      timeBefore: to === null ? null : to.toISOString()
    });
  };

  handleClearSearch = () => {
    this.setState(
      { to: null, from: null },
      this.handleSearch,
    );
  };

  render() {
    const { classes } = this.props;
    const columnHeaders = [
      {
        Header: 'Creator',
        accessor: 'creator_msp_id',
        filterMethod: (filter, rows) => matchSorter(
          rows,
          filter.value,
          { keys: ['creator_msp_id'] },
          { threshold: matchSorter.rankings.SIMPLEMATCH },
        ),
        filterAll: true,
      },
      {
        Header: 'Tx Id',
        accessor: 'txhash',
        className: classes.hash,
        Cell: row => (
          <span>
            <a
              data-command="transaction-partial-hash"
              className={classes.partialHash}
              onClick={() => this.handleDialogOpen(row.value)}
              href="#/transactions"
            >
              <div className={classes.fullHash} id="showTransactionId">
                {row.value}
              </div>
              {' '}
              {row.value.slice(0, 6)}
              {!row.value ? '' : '... '}
            </a>
          </span>
        ),
        filterMethod: (filter, rows) => matchSorter(
          rows,
          filter.value,
          { keys: ['txhash'] },
          { threshold: matchSorter.rankings.SIMPLEMATCH },
        ),
        filterAll: true,
      },
      {
        Header: 'Timestamp',
        accessor: 'createdt',
        filterMethod: (filter, rows) => matchSorter(
          rows,
          filter.value,
          { keys: ['createdt'] },
          { threshold: matchSorter.rankings.SIMPLEMATCH },
        ),
        filterAll: true,
      },
    ];

    const { transactionList } = this.props;
    const { transaction, dialogOpen } = this.state;
    return (
      <div>
        <div className={`${classes.filter} row searchRow`}>
          <div className={`${classes.filterElement} col-md-3`}>
            <label className="label">
From
            </label>
            <DatePicker
              id="from"
              selected={this.state.from}
              showTimeSelect
              timeIntervals={5}
              dateFormat="LLL"
              onChange={from => this.setState({ from })}
            />
          </div>
          <div className={`${classes.filterElement} col-md-3`}>
            <label className="label">
To
            </label>
            <DatePicker
              id="to"
              selected={this.state.to}
              showTimeSelect
              timeIntervals={5}
              dateFormat="LLL"
              onChange={to => this.setState({ to })}
            >
              <div className="validator ">
                {this.timeError() && (
                  <span className=" label border-red">
                    {' '}
                    From date should be less than To date
                  </span>
                )}
              </div>
            </DatePicker>
          </div>
          <div className="col-md-2">
            <Button
              className={classes.searchButton}
              color="success"
              disabled={this.timeError()}
              onClick={async () => {
                await this.handleSearch();
              }}
            >
              Search
            </Button>
          </div>
          <div className="col-md-1">
            <Button
              className={classes.filterButton}
              color="primary"
              onClick={() => {
                this.handleClearSearch();
              }}
            >
              Reset
            </Button>
          </div>
          <div className="col-md-1">
            <Button
              className={classes.filterButton}
              color="secondary"
              onClick={() => this.setState({ filtered: [], sorted: [] })}
            >
              Clear Filter
            </Button>
          </div>
        </div>
        <ReactTable
          data={transactionList}
          columns={columnHeaders}
          defaultPageSize={10}
          list
          filterable
          sorted={this.state.sorted}
          onSortedChange={(sorted) => {
            this.setState({ sorted });
          }}
          filtered={this.state.filtered}
          onFilteredChange={(filtered) => {
            this.setState({ filtered });
          }}
          minRows={0}
          style={{ height: '750px' }}
          showPagination={!(transactionList.length < 5)}
        />

        <Dialog
          open={dialogOpen}
          onClose={this.handleDialogClose}
          fullWidth
          maxWidth="md"
        >
          <TransactionView
            transaction={transaction}
            onClose={this.handleDialogClose}
          />
        </Dialog>
      </div>
    );
  }
}

export default compose(
  withStyles(styles),
	graphql(
		gql`query ($timeAfter: String, $timeBefore: String) {
			list: transactionList(count: 100, timeAfter: $timeAfter, timeBefore: $timeBefore) {
        items {
          hash
          time
          createdBy {
            id
          }
        }
			}
    }`,
    {
      props({ data: { list, refetch } }) {
        return {
          transactionList: list ? list.items.map(({ hash, time, createdBy }) => ({
            txhash: hash,
            createdt: time,
            creator_msp_id: createdBy.id,
          })) : [],
          refetch,
        };
      },
    },
	),
)(Transactions);
