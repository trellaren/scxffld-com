// @ts-ignore
import EC2Icon from 'react-aws-icons/dist/aws/compute/Instance'
// @ts-ignore
import LambdaIcon from 'react-aws-icons/dist/aws/compute/LambdaFunction'
// @ts-ignore
import LoadBalancerIcon from 'react-aws-icons/dist/aws/compute/LoadBalancer'
// @ts-ignore
import AutoScalingIcon from 'react-aws-icons/dist/aws/compute/AutoScaling'
// @ts-ignore
import ECSIcon from 'react-aws-icons/dist/aws/compute/Cluster'
// @ts-ignore
import CloudWatchIcon from 'react-aws-icons/dist/aws/compute/CloudWatch'
// @ts-ignore
import VPCIcon from 'react-aws-icons/dist/aws/compute/VPC'
// @ts-ignore
import NATGatewayIcon from 'react-aws-icons/dist/aws/compute/NATGateway'
// @ts-ignore
import ElasticIPIcon from 'react-aws-icons/dist/aws/compute/ElasticIPAddress'
// @ts-ignore
import InternetGatewayIcon from 'react-aws-icons/dist/aws/compute/InternetGateway'
// @ts-ignore
import S3BucketIcon from 'react-aws-icons/dist/aws/storage/Bucket'
// @ts-ignore
import RDSIcon from 'react-aws-icons/dist/aws/db/DBR'
// @ts-ignore
import { AzVirtualMachine, AzAppService, AzSQLDatabase, AzStorage, AzKeyVault, AzVirtualNetwork, AzFunctions, AzLoadBalancer, AzContainerService, AzEventHubs } from 'azure-react-icons'

import type { ComponentType } from 'react'

export const AWS_ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  'EC2 Instance': EC2Icon,
  'Lambda': LambdaIcon,
  'Load Balancer': LoadBalancerIcon,
  'Auto Scaling': AutoScalingIcon,
  'ECS Cluster': ECSIcon,
  'CloudWatch': CloudWatchIcon,
  'VPC': VPCIcon,
  'NAT Gateway': NATGatewayIcon,
  'Elastic IP': ElasticIPIcon,
  'Internet Gateway': InternetGatewayIcon,
  'S3 Bucket': S3BucketIcon,
  'RDS': RDSIcon,
}

export const AZURE_ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  'Virtual Machine': AzVirtualMachine,
  'App Service': AzAppService,
  'SQL Database': AzSQLDatabase,
  'Storage': AzStorage,
  'Key Vault': AzKeyVault,
  'Virtual Network': AzVirtualNetwork,
  'Functions': AzFunctions,
  'Load Balancer': AzLoadBalancer,
  'Container Service': AzContainerService,
  'Event Hubs': AzEventHubs,
}
