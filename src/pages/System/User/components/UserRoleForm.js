import React, { useState, useEffect } from 'react';
import { Modal, Form, Tree, Button, message } from 'antd';
import { connect } from 'umi';
import { difference, getParentKey, getPlainNode, isEmpty } from '@/utils/utils';
import styles from '@/pages/System/System.less';

const UserRoleForm = connect(({ systemUser: { treeData, checkedKeys }, loading }) => ({
  roleTreeData: treeData,
  roleCheckedKeys: checkedKeys,
  loading:
    loading.effects['systemUser/fetchRoleTree'] || loading.effects['systemUser/grantUserRole'],
}))(({ loading, visible, id, roleTreeData, roleCheckedKeys, closeModal, dispatch }) => {
  const [form] = Form.useForm();
  const { setFieldsValue, resetFields } = form;

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(false);

  // 【获取要修改用户的角色】
  useEffect(() => {
    if (visible) {
      dispatch({
        type: 'systemUser/fetchRoleTree',
        payload: {
          id,
          status: 1,
        },
      });
    }
    return () => {
      dispatch({
        type: 'systemUser/clearRoleTree',
      });
    };
  }, [visible, id, dispatch]);

  // 【回显树复选择框】
  useEffect(() => {
    if (!isEmpty(roleCheckedKeys)) {
      setCheckedKeys(roleCheckedKeys);
      const keys = getPlainNode(roleTreeData)
        .map((item) => {
          if (roleCheckedKeys.includes(item.key)) {
            return getParentKey(item.key, roleTreeData);
          }
          return null;
        })
        .filter((item, i, self) => item && self.indexOf(item === i));
      setExpandedKeys(keys);
      setAutoExpandParent(true);
      // 同步到表单
      setFieldsValue({ ids: roleCheckedKeys });
    }
  }, [roleCheckedKeys, setFieldsValue]);

  // 【树操作】
  const onExpand = (values) => {
    setExpandedKeys(values);
    setAutoExpandParent(false);
  };
  const handleCheck = (values) => {
    const { checked } = values;
    setCheckedKeys(checked);
    // 同步到form表单，因为tree组件不是表单组件的一部分，我无法自动同步，需要手动设置一下。
    setFieldsValue({ ids: [...checked] });
  };

  // 【授权】
  const handleGrant = (values) => {
    const { ids } = values;
    if (!ids) {
      closeModal();
    }
    const oldCheckedKeys = [...roleCheckedKeys];
    const plusRoleIds = difference(ids, oldCheckedKeys);
    const minusRoleIds = difference(oldCheckedKeys, ids);

    dispatch({
      type: 'systemUser/grantUserRole',
      payload: {
        id,
        plusRoleIds,
        minusRoleIds,
      },
      callback: () => {
        resetFields();
        closeModal();
        message.success('用户分配角色成功。');
      },
    });
  };

  return (
    <Modal destroyOnClose title="角色配置" visible={visible} onCancel={closeModal} footer={null}>
      <Form form={form} name="userRoleForm" className={styles.form} onFinish={handleGrant}>
        <Form.Item name="ids">
          <Tree
            checkable
            checkStrictly
            autoExpandParent={autoExpandParent}
            expandedKeys={expandedKeys}
            onExpand={onExpand}
            checkedKeys={checkedKeys}
            onCheck={handleCheck}
            treeData={roleTreeData}
          />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right' }}>
          <Button onClick={closeModal}>取消</Button>
          <Button type="primary" loading={loading} htmlType="submit">
            确定
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default UserRoleForm;
