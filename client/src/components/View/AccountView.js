import React from 'react';
import FontAwesome from 'react-fontawesome';
import Dialog from '@material-ui/core/Dialog';
import Table from 'reactstrap/lib/Table';
import Card from 'reactstrap/lib/Card';
import CardBody from 'reactstrap/lib/CardBody';
import CardTitle from 'reactstrap/lib/CardTitle';
import Modal from '../Styled/Modal';

import compose from 'recompose/compose';
import { gql } from 'apollo-boost';
import { graphql } from 'react-apollo';

export function AccountView({ accountId, onClose, account }) {
  const open = !!accountId;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      {!open ? '' :
        <Modal>
          {modalClasses => <Card className={modalClasses.card}>
            <CardTitle className={modalClasses.title}>
              Account Details
              <button
                type="button"
                onClick={onClose}
                className={modalClasses.closeBtn}
              >
                <FontAwesome name="close" />
              </button>
            </CardTitle>
            <CardBody className={modalClasses.body}>
              {account ?
                <Table striped hover responsive className="table-striped">
                  <tbody>
                    <tr>
                      <th>Acocunt Id</th>
                      <td>{account.id}</td>
                    </tr>
                    <tr>
                      <th>Roles</th>
                      <td>{account.roles.map(({ name }, i) => <div key={i}>{name}</div>)}</td>
                    </tr>
                    <tr>
                      <th>Role Permissions</th>
                      <td>{account.permissions.map((permission, i) => <div key={i}>{permission}</div>)}</td>
                    </tr>
                    <tr>
                      <th>Permissions Granted By Account</th>
                      <td>
                        {account.permissionsGrantedBy.map(({ permission, to }, i) => <div key={i}>
                          {permission} to {to}
                        </div>)}
                      </td>
                    </tr>
                    <tr>
                      <th>Permissions Granted To Account</th>
                      <td>
                        {account.permissionsGrantedTo.map(({ permission, by }, i) => <div key={i}>
                          {permission} by {by}
                        </div>)}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              :
                <FontAwesome name="circle-o-notch" size="3x" spin />
              }
            </CardBody>
          </Card>}
        </Modal>
      }
    </Dialog>
  );
}

export default compose(
  graphql(
    gql`query ($accountId: String!) {
      account: accountById(id: $accountId) {
        id
        roles {
          name
        }
        permissions
        permissionsGrantedBy {
          to
          permission
        }
        permissionsGrantedTo {
          by
          permission
        }
      }
    }`,
    {
      skip({ accountId }) {
        return !accountId;
      },
      options({ accountId }) {
        return {
          variables: {
            accountId,
          },
        };
      },
      props({ data: { account } }) {
        return {
          account,
        };
      },
    },
  ),
)(AccountView);
