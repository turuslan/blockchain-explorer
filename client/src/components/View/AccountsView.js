import React from 'react';
import View from '../Styled/View';
import ReactTable from '../Styled/Table';
import AccountView from './AccountView';

import compose from 'recompose/compose';
import { gql } from 'apollo-boost';
import { graphql } from 'react-apollo';

const columns = [
  {
    Header: 'Id',
    accessor: 'id',
  },
  {
    Header: 'Quorum',
    accessor: 'quorum',
  },
  {
    Header: 'Roles',
    accessor: 'roles',
    Cell: ({ value }) => <div style={{ textAlign: 'left' }}>
      {value.map(({ name }, i) => <div key={i}>{name}</div>)}
    </div>,
  },
];

export class AccountsView extends React.Component {
  state = {
    showAccount: null,
  };

  render() {
    const {
      list,
    } = this.props;
    const {
      showAccount,
    } = this.state;
    return (
      <View>
        <ReactTable
          data={list}
          columns={columns}
          defaultPageSize={5}
          sortable={false}
          minRows={0}
          getTrProps={(state, row) => ({
            onClick: () => this.setState({ showAccount: row.original.id }),
          })}
        />
        <AccountView
          accountId={showAccount}
          onClose={() => this.setState({ showAccount: null })}
        />
      </View>
    );
  }
}

export default compose(
  graphql(
    gql`{
      list: accountList(count: 100) {
        items {
          id
          quorum
          roles {
            name
          }
        }
      }
    }`,
    {
      props({ data: { list } }) {
        return {
          list: list ? list.items : [],
        };
      },
    },
  ),
)(AccountsView);
